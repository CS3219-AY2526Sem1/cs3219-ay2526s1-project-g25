// src/services/matchQueue.js
import { nowMs } from '../utils/clock.js';
import { genId } from '../utils/id.js';
import { fetchRandomQuestion } from './questionClient.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * In-memory structures:
 * - queues: { topic -> { easy:[Waiter], medium:[Waiter], hard:[Waiter] } }
 * - waitingMap: userId -> Waiter (fast lookup & status)
 * - matches: matchId -> Match
 *
 * Waiter = {
 *   userId, selectedTopics:string[], selectedDifficulty:string,
 *   enqueueAt:number(ms), status:'WAITING'|'MATCHED'|'TIMED_OUT'|'SOLO',
 *   matchId?:string
 * }
 *
 * Match = {
 *   matchId, userA, userB, topic, difficulty, createdAt:number(ms),
 *   handshakeExpiresAt:number(ms), question?:object, closed?:boolean
 * }
 */
export class MatchQueue {
  constructor({
    matchTimeoutMs = 120000,
    queueRecalcMs = 5000,
    handshakeTtlMs = 15000
  } = {}) {
    this.matchTimeoutMs = matchTimeoutMs;
    this.queueRecalcMs = queueRecalcMs;
    this.handshakeTtlMs = handshakeTtlMs;

    this.queues = new Map();     // topic -> { easy:[], medium:[], hard:[] }
    this.waitingMap = new Map(); // userId -> Waiter
    this.matches = new Map();    // matchId -> Match

    this._startSchedulers();
  }

  _ensureTopic(topic) {
    if (!this.queues.has(topic)) {
      this.queues.set(topic, { easy: [], medium: [], hard: [] });
    }
  }

  /**
   * Add user to queues for each selected topic on their chosen difficulty.
   */
    async join({ userId, selectedTopics, selectedDifficulty }) {
    // Prevent re-enqueue if user already matched
    const existing = this.waitingMap.get(userId);
    if (existing && existing.status === 'MATCHED') {
        return { status: 'already_matched', match: this.matches.get(existing.matchId) };
    }

    const enqueueAt = nowMs();
    const waiter = { userId, selectedTopics, selectedDifficulty, enqueueAt, status: 'WAITING' };
    this.waitingMap.set(userId, waiter);

    for (const t of selectedTopics) {
        this._ensureTopic(t);
        this.queues.get(t)[selectedDifficulty].push(waiter);
    }

    const result = await this._tryMatchForUser(waiter);
    if (result?.status === 'matched') return result;

    return { status: 'queued', userId, expiresAt: enqueueAt + this.matchTimeoutMs };
    }


  leave(userId) {
    const waiter = this.waitingMap.get(userId);
    if (!waiter) return { removed: false };
    this._removeFromAllQueues(waiter);
    this.waitingMap.delete(userId);
    return { removed: true };
  }

  /**
   * Main matching logic:
   * 1) Perfect match: same topic + same difficulty → oldest first.
   * 2) Fallback: same topic + nearest available difficulty.
   */
  async _tryMatchForUser(waiter) {
    if (!waiter || waiter.status !== 'WAITING') return null;
    console.log(`[queue] Trying to match ${waiter.userId} (${waiter.selectedTopics}, ${waiter.selectedDifficulty})`);

    // 1) Perfect match first
    for (const topic of waiter.selectedTopics) {
      const q = this.queues.get(topic);
      if (!q) continue;
      const lane = q[waiter.selectedDifficulty];
      const candidate = this._pickOldestOther(lane, waiter.userId);
      if (candidate) {
        return await this._finalizePair({ a: waiter, b: candidate, topic, difficulty: waiter.selectedDifficulty });
      }
    }

    // 2) Fallback matching
    for (const topic of waiter.selectedTopics) {
      const q = this.queues.get(topic);
      if (!q) continue;
      const nearest = this._findNearestDifficultyCandidate(q, waiter.selectedDifficulty, waiter.userId);
      if (nearest) {
        return await this._finalizePair({ a: waiter, b: nearest.waiter, topic, difficulty: nearest.difficulty });
      }
    }

    console.log(`[queue] No match yet for ${waiter.userId}`);
    return null;
  }

  _pickOldestOther(lane, otherUserId) {
    const candidates = lane.filter(w => w.userId !== otherUserId && w.status === 'WAITING');
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.enqueueAt - b.enqueueAt);
    return candidates[0];
  }

  _findNearestDifficultyCandidate(topicQueues, desiredDifficulty, otherUserId) {
    const idx = DIFFICULTIES.indexOf(desiredDifficulty);
    const order = [1, -1, 2, -2]
      .map(d => idx + d)
      .filter(i => i >= 0 && i < DIFFICULTIES.length);

    for (const i of order) {
      const diff = DIFFICULTIES[i];
      const lane = topicQueues[diff];
      const candidate = this._pickOldestOther(lane, otherUserId);
      if (candidate) {
        return { waiter: candidate, difficulty: diff };
      }
    }
    return null;
  }

    async _finalizePair({ a, b, topic, difficulty }) {
    const matchId = genId();
    const createdAt = nowMs();
    const handshakeExpiresAt = createdAt + this.handshakeTtlMs;
    

    a.status = 'MATCHED';
    b.status = 'MATCHED';
    this._removeFromAllQueues(a);
    this._removeFromAllQueues(b);

    const match = {
        matchId,
        userA: a.userId,
        userB: b.userId,
        topic,
        difficulty,
        createdAt,
        handshakeExpiresAt,
        question: null,
        handshaked: false,   //NEW FLAG to distinguish matches that have been successful (not disconnected) and handshake has been done
        closed: false
    };

    try {
        const question = await fetchRandomQuestion({ topic, difficulty });
        match.question = question;
    } catch (err) {
        a.status = 'WAITING';
        b.status = 'WAITING';
        this._requeue(a);
        this._requeue(b);
        return { status: 'queued', reason: 'no_question_available' };
    }

    this.matches.set(matchId, match);
    a.matchId = matchId;
    b.matchId = matchId;
    match.handshaked = true; 

    this.waitingMap.set(a.userId, a);
    this.waitingMap.set(b.userId, b);

    return { status: 'matched', match };
    }



    _removeFromAllQueues(waiter) {
    for (const topic of waiter.selectedTopics) {
        const topicQueues = this.queues.get(topic);
        if (!topicQueues) continue;
        for (const d of DIFFICULTIES) {
        const lane = topicQueues[d];
        for (let i = lane.length - 1; i >= 0; i--) {
            if (lane[i].userId === waiter.userId) {
            lane.splice(i, 1);
            }
        }
        }
    }
    }


  _requeue(waiter) {
    waiter.enqueueAt = nowMs();
    waiter.status = 'WAITING';
    for (const t of waiter.selectedTopics) {
      this._ensureTopic(t);
      this.queues.get(t)[waiter.selectedDifficulty].push(waiter);
    }
  }

  _startSchedulers() {
    // fairness tick
    setInterval(() => {
      for (const [, topicQueues] of this.queues) {
        for (const d of DIFFICULTIES) {
          topicQueues[d].sort((a, b) => a.enqueueAt - b.enqueueAt);
        }
      }
    }, this.queueRecalcMs).unref();

    // timeout
    setInterval(() => {
      const now = nowMs();
      for (const [userId, waiter] of this.waitingMap) {
        if (waiter.status !== 'WAITING') continue;
        if (now - waiter.enqueueAt >= this.matchTimeoutMs) {
          waiter.status = 'TIMED_OUT';
          this._removeFromAllQueues(waiter);
        }
      }
    }, 1000).unref();

    // handshake TTL
    setInterval(() => {
    const now = nowMs();
    for (const [matchId, m] of this.matches) {
        //Skip TTL entirely for confirmed matches
        if (m.handshaked === true) continue;

        if (!m.closed && !m.handshaked && m.handshakeExpiresAt && now > m.handshakeExpiresAt) {
        console.log(`[handshakeTTL] Expired match ${matchId}, requeueing users`);
        const a = this.waitingMap.get(m.userA);
        const b = this.waitingMap.get(m.userB);
        if (a && a.status === 'MATCHED') { a.status = 'WAITING'; this._requeue(a); }
        if (b && b.status === 'MATCHED') { b.status = 'WAITING'; this._requeue(b); }
        m.closed = true;
        }
    }
    }, 1000).unref();

  }

  getStatus(userId) {
    const w = this.waitingMap.get(userId);
    console.log(`[getStatus] user=${userId}, status=${w?.status}, matchId=${w?.matchId}`);


    if (!w) return { status: 'NOT_FOUND' };
    if (w.status === 'WAITING') {
      return {
        status: 'WAITING',
        userId,
        enqueueAt: w.enqueueAt,
        expiresAt: w.enqueueAt + this.matchTimeoutMs
      };
    }
    if (w.status === 'MATCHED') {
      const match = this.matches.get(w.matchId);
      return { status: 'MATCHED', match };
    }
    if (w.status === 'TIMED_OUT') {
      return { status: 'TIMED_OUT' };
    }
    if (w.status === 'SOLO') {
      return { status: 'SOLO' };
    }
    return { status: w.status };
  }

    handleDisconnect({ matchId, remainingUserId, action }) {
    const match = this.matches.get(matchId);
    if (!match) {
        return { ok: false, error: 'MATCH_NOT_ACTIVE' };
    }
    if (match.closed) {
        return { ok: false, error: 'MATCH_ALREADY_CLOSED' };
    }
    if (![match.userA, match.userB].includes(remainingUserId)) {
        return { ok: false, error: 'NOT_IN_MATCH' };
    }

    // we can close the match now
    match.closed = true;

    const otherUserId = match.userA === remainingUserId ? match.userB : match.userA;
    const otherWaiter = this.waitingMap.get(otherUserId);
    if (otherWaiter) {
        otherWaiter.status = 'DISCONNECTED';
        this.waitingMap.set(otherUserId, otherWaiter);
  }

    const remWaiter = this.waitingMap.get(remainingUserId);
    if (remWaiter) {
        if (action === 'solo') {
        remWaiter.status = 'SOLO';
        return { ok: true, mode: 'SOLO', question: match.question };
        }
        if (action === 'requeue') {
        remWaiter.status = 'WAITING';
        this._requeue(remWaiter);
        return { ok: true, mode: 'REQUEUED', expiresAt: remWaiter.enqueueAt + this.matchTimeoutMs };
        }
        return { ok: false, error: 'INVALID_ACTION' };
    }
    return { ok: false, error: 'USER_NOT_FOUND' };
}

}
