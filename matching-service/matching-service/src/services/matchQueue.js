import { redisClient } from "./redisClient.js";
import { nowMs } from "../utils/clock.js";
import { genId } from "../utils/id.js";
import { fetchRandomQuestion } from "./questionClient.js";
import axios from "axios";


const DIFFICULTIES = ["easy", "medium", "hard"];
const COLLAB_SERVICE_BASE_URL =
  process.env.COLLAB_SERVICE_BASE_URL || "http://localhost:3004";

export class MatchQueue {
  constructor({
    matchTimeoutMs = 120000,
    handshakeTtlMs = 15000,
    fallbackThresholdMs = 60000,
    fallbackCheckMs = 5000, // ⏱ check every 5 s
  } = {}) {
    this.matchTimeoutMs = matchTimeoutMs;
    this.handshakeTtlMs = handshakeTtlMs;
    this.fallbackThresholdMs = fallbackThresholdMs;
    this.fallbackCheckMs = fallbackCheckMs;
    this._startFallbackChecker();
  }

  async _removeFromAllQueues(waiter) {
    const topics = JSON.parse(waiter.selectedTopics);
    for (const t of topics)
      for (const d of DIFFICULTIES)
        await redisClient.zRem(`queue:${t}:${d}`, waiter.userId);
  }

  /*───────────────────────────────────────────────*/
async getStatus(userId) {
  const waiter = await redisClient.hGetAll(`waiter:${userId}`);
  if (!waiter || !waiter.status) return { status: "NOT_FOUND" };

  // 💡 Return queue info if still waiting
  if (waiter.status !== "MATCHED") {
    return {
      status: waiter.status,
      userId,
      enqueueAt: Number(waiter.enqueueAt || 0),
      expiresAt: Number(waiter.enqueueAt || 0) + this.matchTimeoutMs,
    };
  }

  // 🟢 Get match details
  const rawMatch = await redisClient.hGetAll(`match:${waiter.matchId}`);
  if (!rawMatch || Object.keys(rawMatch).length === 0) {
    return { status: "NOT_FOUND" };
  }

  // Parse question JSON safely
  let question = {};
  try {
    question = JSON.parse(rawMatch.question || "{}");
  } catch {}

  // Retry once for sessionId if missing (to avoid race)
  let sessionId = rawMatch.sessionId || "";
  if (!sessionId) {
    await new Promise((r) => setTimeout(r, 200));
    const re = await redisClient.hGetAll(`match:${waiter.matchId}`);
    sessionId = re.sessionId || "";
  }

  // Determine user identity cleanly
  const isUserA = String(userId) === rawMatch.userA;
  const currentUserId = isUserA ? rawMatch.userA : rawMatch.userB;
  const partnerId = isUserA ? rawMatch.userB : rawMatch.userA;

  // ✅ Return fully personalized payload
  return {
    status: "MATCHED",
    match: {
      matchId: rawMatch.matchId,
      topic: rawMatch.topic,
      difficulty: rawMatch.difficulty,
      createdAt: rawMatch.createdAt,
      sessionId,
      userId: currentUserId,
      partnerId,
      question,
    },
  };
}


  /*───────────────────────────────────────────────*/
  async handleDisconnect({ matchId, remainingUserId, action }) {
    const match = await redisClient.hGetAll(`match:${matchId}`);
    if (!match || match.closed === "true") return { ok: false, error: "MATCH_NOT_ACTIVE" };

    const otherUserId = match.userA === remainingUserId ? match.userB : match.userA;
    await redisClient.hSet(`waiter:${otherUserId}`, { status: "DISCONNECTED" });

    if (action === "solo") {
      await redisClient.hSet(`waiter:${remainingUserId}`, { status: "SOLO" });
      return { ok: true, mode: "SOLO", question: JSON.parse(match.question || "{}") };
    }

    if (action === "requeue") {
      const waiter = await redisClient.hGetAll(`waiter:${remainingUserId}`);
      waiter.status = "WAITING";
      waiter.enqueueAt = nowMs().toString();
      await redisClient.hSet(`waiter:${remainingUserId}`, waiter);
      await redisClient.zAdd(`queue:${match.topic}:${match.difficulty}`, [
        { score: nowMs(), value: remainingUserId },
      ]);
      return { ok: true, mode: "REQUEUED", expiresAt: nowMs() + this.matchTimeoutMs };
    }

    return { ok: false, error: "INVALID_ACTION" };
  }

    /** ───────────────────────────────
   *  User manually leaves the queue
   *  ─────────────────────────────── */
  async leave(userId) {
    // 1  Fetch the waiter from Redis
    const waiter = await redisClient.hGetAll(`waiter:${userId}`);
    if (!waiter || !waiter.status) {
      return { removed: false, message: "User not found or not in queue" };
    }

    // 2 If the user is already matched, prevent leaving
    if (waiter.status === "MATCHED") {
      return { removed: false, message: "User already matched" };
    }

    // 3 Remove user from all queues
    await this._removeFromAllQueues(waiter);

    // 4 Delete the waiter record
    await redisClient.del(`waiter:${userId}`);

    console.log(`[leave] User ${userId} removed from all queues`);
    return { removed: true, message: "User successfully removed from queue" };
  }

  

  /*───────────────────────────────────────────────
   *  Add user to queue
   *───────────────────────────────────────────────*/
  async join({ userId, selectedTopics, selectedDifficulty }) {
    const existing = await redisClient.hGetAll(`waiter:${userId}`);
    if (existing && existing.status && existing.status.toUpperCase() === "MATCHED") {
      const match = await redisClient.hGetAll(`match:${existing.matchId}`);
      if (match && Object.keys(match).length) {
        match.question = JSON.parse(match.question || "{}");
        return { status: "already_matched", match };
      }
    }

    const enqueueAt = nowMs();
    const waiter = {
      userId,
      selectedTopics: JSON.stringify(selectedTopics),
      selectedDifficulty,
      enqueueAt: enqueueAt.toString(),
      status: "WAITING",
    };

    await redisClient.hSet(`waiter:${userId}`, waiter);
    for (const topic of selectedTopics) {
      await redisClient.zAdd(`queue:${topic}:${selectedDifficulty}`, [
        { score: enqueueAt, value: userId },
      ]);
    }
    await redisClient.expire(`waiter:${userId}`, this.matchTimeoutMs / 1000);

    const result = await this._tryMatchForUser(waiter);
    return result?.status === "matched"
      ? result
      : { status: "queued", userId, expiresAt: enqueueAt + this.matchTimeoutMs };
  }

  /*───────────────────────────────────────────────
   *  Try match for one user
   *───────────────────────────────────────────────*/
  async _tryMatchForUser(waiter) {
    if (!waiter || waiter.status !== "WAITING") return null;
    const topics = JSON.parse(waiter.selectedTopics);
    const { selectedDifficulty } = waiter;

    // 1️⃣ perfect match
    for (const topic of topics) {
      const laneKey = `queue:${topic}:${selectedDifficulty}`;
      const candidates = await redisClient.zRange(laneKey, 0, -1);
      const candidateId = candidates.find((id) => id !== waiter.userId);
      if (candidateId) {
        const candidate = await redisClient.hGetAll(`waiter:${candidateId}`);
        if (candidate.status === "WAITING") {
          return await this._finalizePair({ a: waiter, b: candidate, topic, difficulty: selectedDifficulty });
        }
      }
    }

    // 2️⃣ fallback cross-difficulty
    const now = nowMs();
    if (now - Number(waiter.enqueueAt) >= this.fallbackThresholdMs) {
      for (const topic of topics) {
        const fb = await this._findFallbackCandidate(topic, waiter, now);
        if (fb) {
          return await this._finalizePair({ a: waiter, b: fb.waiter, topic, difficulty: fb.difficulty });
        }
      }
    }

    return null;
  }

  /*───────────────────────────────────────────────
   *  Find fallback candidate
   *───────────────────────────────────────────────*/
  async _findFallbackCandidate(topic, currentWaiter, now) {
    const currentDiff = currentWaiter.selectedDifficulty;
    const idx = DIFFICULTIES.indexOf(currentDiff);
    const order = [1, -1, 2, -2].map((d) => idx + d).filter((i) => i >= 0 && i < DIFFICULTIES.length);

    for (const i of order) {
      const diff = DIFFICULTIES[i];
      const laneKey = `queue:${topic}:${diff}`;
      const ids = await redisClient.zRange(laneKey, 0, -1);

      for (const id of ids) {
        if (id === currentWaiter.userId) continue;
        const w = await redisClient.hGetAll(`waiter:${id}`);
        if (w.status === "WAITING" && now - Number(w.enqueueAt) >= this.fallbackThresholdMs) {
          return { waiter: w, difficulty: diff };
        }
      }
    }
    return null;
  }

  /*───────────────────────────────────────────────
   *  Finalize match
   *───────────────────────────────────────────────*/
  /*───────────────────────────────────────────────
 *  Finalize match
 *───────────────────────────────────────────────*/
async _finalizePair({ a, b, topic, difficulty }) {
  const matchId = genId();
  const createdAt = nowMs();
  const handshakeExpiresAt = createdAt + this.handshakeTtlMs;

  // Base match metadata
  const match = {
    matchId,
    userA: a.userId,
    userB: b.userId,
    topic,
    difficulty,
    createdAt: createdAt.toString(),
    handshakeExpiresAt: handshakeExpiresAt.toString(),
    handshaked: "true",
    closed: "false",
  };

  /* ───────────────────────────────
   *  1️⃣ Fetch question (safe fallback)
   * ─────────────────────────────── */
  try {
    match.question = await fetchRandomQuestion({ topic, difficulty });
  } catch {
    match.question = {
      id: `mock-${topic}-${difficulty}`,
      title: `Mock ${difficulty} ${topic} Question`,
      description: "This is a mock question for testing",
      difficulty,
      topic,
    };
  }

  /* ───────────────────────────────
   *  2️⃣ Create collaboration session
   *      BEFORE marking users matched
   * ─────────────────────────────── */
  let sessionId = "";
  try {
    const res = await axios.post(`${COLLAB_SERVICE_BASE_URL}/sessions`, {
      userA: a.userId,
      userB: b.userId,
      topic,
      difficulty,
      questionId: match.question.id,
    });
    sessionId = res.data?.id || "";
    console.log(`[collab] Session created: ${sessionId}`);
  } catch (err) {
    console.error("[collab] Failed to create session:", err.message);
  }

  /* ───────────────────────────────
   *  3️⃣ Save match record atomically
   *      with sessionId already set
   * ─────────────────────────────── */
  const redisMatch = {
    ...match,
    sessionId,
    question: JSON.stringify(match.question),
  };

  await redisClient.hSet(`match:${matchId}`, redisMatch);
  await redisClient.expire(`match:${matchId}`, 180);

  /* ───────────────────────────────
   *  4️⃣ Remove users from queues
   * ─────────────────────────────── */
  await this._removeFromAllQueues(a);
  await this._removeFromAllQueues(b);

  /* ───────────────────────────────
   *  5️⃣ Mark users as MATCHED
   * ─────────────────────────────── */
  await redisClient.hSet(`waiter:${a.userId}`, { status: "MATCHED", matchId });
  await redisClient.hSet(`waiter:${b.userId}`, { status: "MATCHED", matchId });

  console.log(
    `[match] ✅ Matched ${a.userId} ↔ ${b.userId} on ${topic} (${difficulty}), session ${sessionId}`
  );

  /* ───────────────────────────────
   *  6️⃣ Return complete match payload
   * ─────────────────────────────── */
  return {
    status: "matched",
    match: {
      ...match,
      sessionId,
    },
  };
}




  /*───────────────────────────────────────────────
   * Background fallback scheduler
   *───────────────────────────────────────────────*/
  _startFallbackChecker() {
    setInterval(async () => {
      const keys = await redisClient.keys("waiter:*");
      const now = nowMs();

      for (const key of keys) {
        const waiter = await redisClient.hGetAll(key);
        if (!waiter.status || waiter.status !== "WAITING") continue;

        if (now - Number(waiter.enqueueAt) >= this.fallbackThresholdMs) {
          await this._tryMatchForUser(waiter);
        }
      }
    }, this.fallbackCheckMs).unref();
  }
}


