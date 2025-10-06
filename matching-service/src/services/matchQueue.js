import { redisClient } from "./redisClient.js";
import { nowMs } from "../utils/clock.js";
import { genId } from "../utils/id.js";
import { fetchRandomQuestion } from "./questionClient.js";

const DIFFICULTIES = ["easy", "medium", "hard"];

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

    // 1 perfect match
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

    // 2️ fallback cross-difficulty
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
  async _finalizePair({ a, b, topic, difficulty }) {
    const matchId = genId();
    const createdAt = nowMs();
    const handshakeExpiresAt = createdAt + this.handshakeTtlMs;
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

    await redisClient.hSet(`match:${matchId}`, {
      ...match,
      question: JSON.stringify(match.question),
    });
    await redisClient.expire(`match:${matchId}`, 180);

    await redisClient.hSet(`waiter:${a.userId}`, { status: "MATCHED", matchId });
    await redisClient.hSet(`waiter:${b.userId}`, { status: "MATCHED", matchId });

    await this._removeFromAllQueues(a);
    await this._removeFromAllQueues(b);

    console.log(`[match] Matched ${a.userId} ↔ ${b.userId} on ${topic} (${difficulty})`);
    return { status: "matched", match };
  }


}


