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
  const currentUsername = isUserA
    ? rawMatch.userAName || rawMatch.userAUsername || rawMatch.userA
    : rawMatch.userBName || rawMatch.userBUsername || rawMatch.userB;
  const partnerUsername = isUserA
    ? rawMatch.userBName || rawMatch.userBUsername || rawMatch.userB
    : rawMatch.userAName || rawMatch.userAUsername || rawMatch.userA;

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
      username: currentUsername,
      partnerId,
      partnerUsername,
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
    console.log(`[leave] Starting cleanup for user ${userId}`);
    
    // 1 Fetch the waiter from Redis
    const waiter = await redisClient.hGetAll(`waiter:${userId}`);
    console.log(`[leave] Retrieved waiter for ${userId}:`, JSON.stringify(waiter));
    
    let matchToCleanup = null;
    
    // If we have a matchId, use it; otherwise scan for matches
    if (waiter && waiter.matchId) {
      console.log(`[leave] User ${userId} has matchId ${waiter.matchId}`);
      try {
        matchToCleanup = await redisClient.hGetAll(`match:${waiter.matchId}`);
        console.log(`[leave] Retrieved match ${waiter.matchId}:`, JSON.stringify(matchToCleanup));
      } catch (err) {
        console.error(`[leave] Failed to retrieve match ${waiter.matchId}:`, err);
      }
    } else {
      // No matchId in waiter, scan all matches
      console.log(`[leave] No matchId in waiter, scanning all matches`);
      try {
        const allMatchKeys = await redisClient.keys("match:*");
        console.log(`[leave] Scanning ${allMatchKeys.length} match records`);
        for (const matchKey of allMatchKeys) {
          const match = await redisClient.hGetAll(matchKey);
          if (match && (match.userA === userId || match.userB === userId)) {
            matchToCleanup = match;
            console.log(`[leave] Found match ${matchKey} involving ${userId}`);
            break;
          }
        }
      } catch (err) {
        console.error(`[leave] Error scanning matches:`, err);
      }
    }

    // 2 Clean up the match if found
    if (matchToCleanup && Object.keys(matchToCleanup).length > 0) {
      const matchId = matchToCleanup.matchId || waiter?.matchId;
      const matchKey = `match:${matchId}`;
      
      console.log(`[leave] Cleaning up match ${matchKey}`);
      
      // Mark match as closed first
      await redisClient.hSet(matchKey, 'closed', 'true');
      console.log(`[leave] Marked match ${matchKey} as closed`);
      
      // Clean up the other user in the match
      const otherUserId = matchToCleanup.userA === userId ? matchToCleanup.userB : matchToCleanup.userA;
      if (otherUserId && otherUserId !== userId) {
        console.log(`[leave] Cleaning up other user ${otherUserId}`);
        
        // Get other user's waiter to remove from queues
        const otherWaiter = await redisClient.hGetAll(`waiter:${otherUserId}`);
        if (otherWaiter && otherWaiter.userId) {
          await this._removeFromAllQueues(otherWaiter);
          console.log(`[leave] Removed ${otherUserId} from all queues`);
        }
        
        // Delete the other user's waiter record
        await redisClient.del(`waiter:${otherUserId}`);
        console.log(`[leave] Deleted waiter for ${otherUserId}`);
      }
      
      // Delete the match record
      await redisClient.del(matchKey);
      console.log(`[leave] Deleted match record ${matchKey}`);
    }

    // 3 Remove user from all queues (if still in queue)
    if (waiter && waiter.userId) {
      await this._removeFromAllQueues(waiter);
      console.log(`[leave] Removed ${userId} from all queues`);
    }

    // 4 Delete the waiter record
    await redisClient.del(`waiter:${userId}`);
    console.log(`[leave] Deleted waiter for ${userId}`);

    console.log(`[leave] User ${userId} completely cleaned up`);
    return { removed: true, message: "User successfully removed from queue and all match state" };
  }

  

  /*───────────────────────────────────────────────
   *  Add user to queue
   *───────────────────────────────────────────────*/
  async join({ userId, username = "", selectedTopics, selectedDifficulty }) {
    console.log(`[join] Attempting to join for user ${userId} with topics=${JSON.stringify(selectedTopics)}, difficulty=${selectedDifficulty}`);
    
    const existing = await redisClient.hGetAll(`waiter:${userId}`);
    if (existing && existing.status && existing.status.toUpperCase() === "MATCHED") {
      console.log(`[join] User ${userId} has MATCHED status, matchId=${existing.matchId}, checking match...`);
      
      // Check if match record exists
      let match = null;
      if (existing.matchId) {
        match = await redisClient.hGetAll(`match:${existing.matchId}`);
        console.log(`[join] Retrieved match ${existing.matchId}, keys=${Object.keys(match).length}, closed=${match.closed}`);
      }
      
      // If match doesn't exist or is closed, clean it up
      if (!match || Object.keys(match).length === 0 || match.closed === "true") {
        console.log(`[join] Match ${existing.matchId} is closed or missing, cleaning up stale state`);
        await redisClient.del(`waiter:${userId}`);
        
        // Clean up other user if match exists
        if (match && Object.keys(match).length > 0) {
          const otherUserId = match.userA === userId ? match.userB : match.userA;
          if (otherUserId && otherUserId !== userId) {
            // Get other user's waiter to remove them from queues properly
            const otherWaiter = await redisClient.hGetAll(`waiter:${otherUserId}`);
            if (otherWaiter && otherWaiter.userId) {
              // Remove from queues
              if (otherWaiter.selectedTopics) {
                try {
                  const topics = JSON.parse(otherWaiter.selectedTopics);
                  for (const t of topics) {
                    for (const d of DIFFICULTIES) {
                      await redisClient.zRem(`queue:${t}:${d}`, otherUserId);
                    }
                  }
                } catch (e) {
                  console.error(`[join] Error removing ${otherUserId} from queues:`, e);
                }
              }
            }
            await redisClient.del(`waiter:${otherUserId}`);
            console.log(`[join] Also cleaned up ${otherUserId}`);
          }
          await redisClient.del(`match:${existing.matchId}`);
        }
      } else {
        // Match is active - check if it's actually stale
        match.question = JSON.parse(match.question || "{}");
        const matchAge = nowMs() - Number(match.createdAt || "0");
        const hasSessionId = match.sessionId && match.sessionId.length > 0;
        
        console.log(`[join] Match age=${matchAge}ms, hasSessionId=${hasSessionId}, sessionId=${match.sessionId}`);
        
        // If match doesn't have a sessionId and is older than 30 seconds, it's stale
        // OR if it has a sessionId, check if the session still exists
        let isStale = !hasSessionId && matchAge > 30000;
        
        // If match has sessionId, verify the session still exists
        if (hasSessionId) {
          try {
            const axios = (await import('axios')).default;
            const collabServiceUrl = process.env.COLLAB_SERVICE_BASE_URL || "http://localhost:3004";
            const sessionRes = await axios.get(`${collabServiceUrl}/sessions/${match.sessionId}`, { timeout: 2000 });
            const session = sessionRes.data?.session;
            
            // If session doesn't exist or is ended, match is stale
            if (!session || session.status === "ended") {
              console.log(`[join] Session ${match.sessionId} is ended or doesn't exist, match is stale`);
              isStale = true;
            }
          } catch (err) {
            // If we can't reach the collaboration service, assume match is stale if it's old
            console.log(`[join] Could not verify session ${match.sessionId}, assuming match is stale`);
            isStale = matchAge > 60000; // If session check fails and match is >60s old, consider it stale
          }
        }
        
        if (isStale || matchAge > 1800000) {
          console.log(`[join] Match ${existing.matchId} is stale or too old (age=${matchAge}ms, stale=${isStale}), cleaning up`);
          await redisClient.del(`waiter:${userId}`);
          await redisClient.del(`match:${existing.matchId}`);
          
          // Also clean up the other user if they exist
          const otherUserId = match.userA === userId ? match.userB : match.userA;
          if (otherUserId && otherUserId !== userId) {
            // Get other user's waiter to remove them from queues properly
            const otherWaiter = await redisClient.hGetAll(`waiter:${otherUserId}`);
            if (otherWaiter && otherWaiter.userId) {
              // Remove from queues
              if (otherWaiter.selectedTopics) {
                try {
                  const topics = JSON.parse(otherWaiter.selectedTopics);
                  for (const t of topics) {
                    for (const d of DIFFICULTIES) {
                      await redisClient.zRem(`queue:${t}:${d}`, otherUserId);
                    }
                  }
                } catch (e) {
                  console.error(`[join] Error removing ${otherUserId} from queues:`, e);
                }
              }
            }
            await redisClient.del(`waiter:${otherUserId}`);
            console.log(`[join] Also cleaned up ${otherUserId}`);
          }
        } else {
          console.log(`[join] User ${userId} is in an active match (age ${matchAge}ms), returning already_matched`);
          return { status: "already_matched", match };
        }
      }
    }

    // Delete any existing waiter record to start fresh
    await redisClient.del(`waiter:${userId}`);
    console.log(`[join] Cleared any stale waiter record for ${userId}`);
    
    const enqueueAt = nowMs();
    const waiter = {
      userId,
      username,
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
  const userAName = a.username || "";
  const userBName = b.username || "";
  const match = {
    matchId,
    userA: a.userId,
    userAName,
    userB: b.userId,
    userBName,
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
      userAName,
      userBName,
      topic,
      difficulty,
      questionId: match.question.id,
      questionTitle: match.question.title,
      questionDescription: match.question.description,
      questionDifficulty: match.question.difficulty || difficulty,
      questionTopic: match.question.topic || topic,
      question: match.question,
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


