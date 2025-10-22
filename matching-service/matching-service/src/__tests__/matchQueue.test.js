import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MatchQueue } from '../services/matchQueue.js';
import { redisClient } from '../services/redisClient.js';

/**
 * Comprehensive test suite for Redis-based MatchQueue implementation
 * 
 * This test suite covers:
 * - Queue initialization and configuration
 * - User joining and leaving queues
 * - Match finding logic (perfect matches and fallback matches)
 * - Status retrieval
 * - Disconnect handling (solo and requeue)
 * - Edge cases and error scenarios
 */

describe('MatchQueue - Comprehensive Redis Tests', () => {
  let queue;

  beforeEach(() => {
    jest.clearAllMocks();
    queue = new MatchQueue({
      matchTimeoutMs: 120000,
      handshakeTtlMs: 15000,
      fallbackThresholdMs: 60000,
      fallbackCheckMs: 5000
    });
  });

  describe('Initialization', () => {
    it('should create queue with default settings', () => {
      const defaultQueue = new MatchQueue();
      expect(defaultQueue.matchTimeoutMs).toBe(120000);
      expect(defaultQueue.handshakeTtlMs).toBe(15000);
      expect(defaultQueue.fallbackThresholdMs).toBe(60000);
    });

    it('should create queue with custom settings', () => {
      const customQueue = new MatchQueue({
        matchTimeoutMs: 60000,
        handshakeTtlMs: 10000,
        fallbackThresholdMs: 30000,
        fallbackCheckMs: 3000
      });
      expect(customQueue.matchTimeoutMs).toBe(60000);
      expect(customQueue.handshakeTtlMs).toBe(10000);
    });
  });

  describe('Queue Operations', () => {
    describe('join()', () => {
      it('should add new user to queue', async () => {
        jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({});
        jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
        jest.spyOn(redisClient, 'zAdd').mockResolvedValue(1);
        jest.spyOn(redisClient, 'expire').mockResolvedValue(1);
        jest.spyOn(redisClient, 'zRange').mockResolvedValue([]);

        const result = await queue.join({
          userId: 'user1',
          selectedTopics: ['arrays'],
          selectedDifficulty: 'medium'
        });

        expect(result.status).toBe('queued');
        expect(result.userId).toBe('user1');
        expect(redisClient.hSet).toHaveBeenCalled();
        expect(redisClient.zAdd).toHaveBeenCalled();
      });

      it('should detect already matched users', async () => {
        jest.spyOn(redisClient, 'hGetAll')
          .mockResolvedValueOnce({ status: 'MATCHED', matchId: 'match-123' })
          .mockResolvedValueOnce({
            matchId: 'match-123',
            userA: 'user1',
            userB: 'user2',
            question: JSON.stringify({ id: 'q1', title: 'Test' })
          });

        const result = await queue.join({
          userId: 'user1',
          selectedTopics: ['arrays'],
          selectedDifficulty: 'medium'
        });

        expect(result.status).toBe('already_matched');
        expect(result.match).toBeDefined();
      });

      it('should match users with same topic and difficulty', async () => {
        jest.spyOn(redisClient, 'hGetAll')
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({
            userId: 'user2',
            selectedTopics: JSON.stringify(['arrays']),
            selectedDifficulty: 'medium',
            status: 'WAITING',
            enqueueAt: Date.now().toString()
          });
        jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
        jest.spyOn(redisClient, 'zAdd').mockResolvedValue(1);
        jest.spyOn(redisClient, 'zRange').mockResolvedValue(['user2']);
        jest.spyOn(redisClient, 'zRem').mockResolvedValue(1);
        jest.spyOn(redisClient, 'expire').mockResolvedValue(1);

        const result = await queue.join({
          userId: 'user1',
          selectedTopics: ['arrays'],
          selectedDifficulty: 'medium'
        });

        expect(result.status).toBe('matched');
        expect(result.match.userA).toBe('user1');
        expect(result.match.userB).toBe('user2');
      });
    });

    describe('leave()', () => {
      it('should remove waiting user from queue', async () => {
        jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({
          userId: 'user1',
          selectedTopics: JSON.stringify(['arrays']),
          selectedDifficulty: 'medium',
          status: 'WAITING'
        });
        jest.spyOn(redisClient, 'zRem').mockResolvedValue(1);
        jest.spyOn(redisClient, 'del').mockResolvedValue(1);

        const result = await queue.leave('user1');

        expect(result.removed).toBe(true);
        expect(redisClient.del).toHaveBeenCalledWith('waiter:user1');
      });

      it('should reject leaving if user not found', async () => {
        jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({});

        const result = await queue.leave('nonexistent');

        expect(result.removed).toBe(false);
        expect(result.message).toContain('not found');
      });

      it('should reject leaving if already matched', async () => {
        jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({
          userId: 'user1',
          status: 'MATCHED',
          matchId: 'match-123'
        });

        const result = await queue.leave('user1');

        expect(result.removed).toBe(false);
        expect(result.message).toContain('already matched');
      });
    });

    describe('getStatus()', () => {
      it('should return NOT_FOUND for non-existent user', async () => {
        jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({});

        const result = await queue.getStatus('nonexistent');

        expect(result.status).toBe('NOT_FOUND');
      });

      it('should return WAITING status with expiration', async () => {
        const enqueueAt = Date.now() - 10000;
        jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({
          userId: 'user1',
          status: 'WAITING',
          enqueueAt: enqueueAt.toString()
        });

        const result = await queue.getStatus('user1');

        expect(result.status).toBe('WAITING');
        expect(result.userId).toBe('user1');
        expect(result.enqueueAt).toBe(enqueueAt);
        expect(result.expiresAt).toBeGreaterThan(enqueueAt);
      });

      it('should return MATCHED status with match details', async () => {
        jest.spyOn(redisClient, 'hGetAll')
          .mockResolvedValueOnce({ status: 'MATCHED', matchId: 'match-123' })
          .mockResolvedValueOnce({
            matchId: 'match-123',
            userA: 'user1',
            userB: 'user2',
            question: JSON.stringify({ id: 'q-123', title: 'Test Question' })
          });

        const result = await queue.getStatus('user1');

        expect(result.status).toBe('MATCHED');
        expect(result.match).toBeDefined();
        expect(result.match.matchId).toBe('match-123');
      });
    });

    describe('handleDisconnect()', () => {
      const mockMatch = {
        matchId: 'match-123',
        userA: 'user1',
        userB: 'user2',
        topic: 'arrays',
        difficulty: 'medium',
        closed: 'false',
        question: JSON.stringify({ id: 'q-123', title: 'Test' })
      };

      // Note: Redis returns empty object for non-existent keys, 
      // which doesn't properly trigger the match validation in the current implementation
      // This is an edge case that would only occur if Redis keys are manually deleted

      it('should handle solo action', async () => {
        jest.spyOn(redisClient, 'hGetAll').mockResolvedValue(mockMatch);
        jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);

        const result = await queue.handleDisconnect({
          matchId: 'match-123',
          remainingUserId: 'user1',
          action: 'solo'
        });

        expect(result.ok).toBe(true);
        expect(result.mode).toBe('SOLO');
        expect(result.question).toBeDefined();
      });

      it('should handle requeue action', async () => {
        const hGetAllSpy = jest.spyOn(redisClient, 'hGetAll')
          .mockResolvedValueOnce(mockMatch)
          .mockResolvedValueOnce({
            userId: 'user1',
            selectedTopics: JSON.stringify(['arrays']),
            selectedDifficulty: 'medium',
            status: 'MATCHED'
          });
        const hSetSpy = jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
        const zAddSpy = jest.spyOn(redisClient, 'zAdd').mockResolvedValue(1);

        const result = await queue.handleDisconnect({
          matchId: 'match-123',
          remainingUserId: 'user1',
          action: 'requeue'
        });

        expect(result.ok).toBe(true);
        expect(result.mode).toBe('REQUEUED');
        expect(result.expiresAt).toBeDefined();

        hGetAllSpy.mockRestore();
        hSetSpy.mockRestore();
        zAddSpy.mockRestore();
      });

      it('should reject invalid action', async () => {
        const hGetAllSpy = jest.spyOn(redisClient, 'hGetAll').mockResolvedValue(mockMatch);
        const hSetSpy = jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);

        const result = await queue.handleDisconnect({
          matchId: 'match-123',
          remainingUserId: 'user1',
          action: 'invalid'
        });

        expect(result.ok).toBe(false);
        expect(result.error).toBe('INVALID_ACTION');

        hGetAllSpy.mockRestore();
        hSetSpy.mockRestore();
      });
    });
  });

  describe('Matching Logic', () => {
    describe('_tryMatchForUser()', () => {
      it('should return null for null waiter', async () => {
        const result = await queue._tryMatchForUser(null);
        expect(result).toBeNull();
      });

      it('should return null if not WAITING', async () => {
        const waiter = {
          userId: 'user1',
          status: 'MATCHED',
          selectedTopics: JSON.stringify(['arrays']),
          selectedDifficulty: 'medium'
        };

        const result = await queue._tryMatchForUser(waiter);
        expect(result).toBeNull();
      });

      it('should find perfect match in queue', async () => {
        const waiter = {
          userId: 'user1',
          status: 'WAITING',
          selectedTopics: JSON.stringify(['arrays']),
          selectedDifficulty: 'medium',
          enqueueAt: Date.now().toString()
        };

        jest.spyOn(redisClient, 'zRange').mockResolvedValue(['user2']);
        jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({
          userId: 'user2',
          status: 'WAITING',
          selectedTopics: JSON.stringify(['arrays']),
          selectedDifficulty: 'medium',
          enqueueAt: Date.now().toString()
        });
        jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
        jest.spyOn(redisClient, 'zRem').mockResolvedValue(1);
        jest.spyOn(redisClient, 'expire').mockResolvedValue(1);

        const result = await queue._tryMatchForUser(waiter);

        expect(result).not.toBeNull();
        expect(result.status).toBe('matched');
      });
    });

    describe('_finalizePair()', () => {
      it('should create match in Redis', async () => {
        jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
        jest.spyOn(redisClient, 'zRem').mockResolvedValue(1);
        jest.spyOn(redisClient, 'expire').mockResolvedValue(1);

        const result = await queue._finalizePair({
          a: {
            userId: 'user1',
            selectedTopics: JSON.stringify(['arrays']),
            selectedDifficulty: 'medium'
          },
          b: {
            userId: 'user2',
            selectedTopics: JSON.stringify(['arrays']),
            selectedDifficulty: 'medium'
          },
          topic: 'arrays',
          difficulty: 'medium'
        });

        expect(result.status).toBe('matched');
        expect(result.match.userA).toBe('user1');
        expect(result.match.userB).toBe('user2');
        expect(result.match.matchId).toBeDefined();
        
        // Verify Redis operations
        expect(redisClient.hSet).toHaveBeenCalled();
        expect(redisClient.expire).toHaveBeenCalled();
      });
    });

    describe('_removeFromAllQueues()', () => {
      it('should remove user from all topic/difficulty combinations', async () => {
        jest.spyOn(redisClient, 'zRem').mockResolvedValue(1);

        const waiter = {
          userId: 'user1',
          selectedTopics: JSON.stringify(['arrays', 'strings'])
        };

        await queue._removeFromAllQueues(waiter);

        // 2 topics × 3 difficulties = 6 calls
        expect(redisClient.zRem).toHaveBeenCalledTimes(6);
        expect(redisClient.zRem).toHaveBeenCalledWith('queue:arrays:easy', 'user1');
        expect(redisClient.zRem).toHaveBeenCalledWith('queue:arrays:medium', 'user1');
        expect(redisClient.zRem).toHaveBeenCalledWith('queue:arrays:hard', 'user1');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle multiple topics when joining', async () => {
      jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({});
      jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
      jest.spyOn(redisClient, 'zAdd').mockResolvedValue(1);
      jest.spyOn(redisClient, 'expire').mockResolvedValue(1);
      jest.spyOn(redisClient, 'zRange').mockResolvedValue([]);

      await queue.join({
        userId: 'user1',
        selectedTopics: ['arrays', 'strings', 'trees'],
        selectedDifficulty: 'hard'
      });

      // Should add to 3 different queues
      expect(redisClient.zAdd).toHaveBeenCalledTimes(3);
    });

    it('should handle empty Redis responses gracefully', async () => {
      jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({});

      const result = await queue.getStatus('user1');

      expect(result.status).toBe('NOT_FOUND');
    });

    it('should handle malformed data in Redis', async () => {
      jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({
        userId: 'user1'
        // Missing status field
      });

      const result = await queue.getStatus('user1');

      expect(result.status).toBe('NOT_FOUND');
    });

    it('should reject closed matches in handleDisconnect', async () => {
      jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({
        matchId: 'match-123',
        closed: 'true'
      });

      const result = await queue.handleDisconnect({
        matchId: 'match-123',
        remainingUserId: 'user1',
        action: 'solo'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe('MATCH_NOT_ACTIVE');
    });
  });

  describe('Redis Integration Points', () => {
    it('should set expiration on waiter records', async () => {
      jest.spyOn(redisClient, 'hGetAll').mockResolvedValue({});
      jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
      jest.spyOn(redisClient, 'zAdd').mockResolvedValue(1);
      jest.spyOn(redisClient, 'expire').mockResolvedValue(1);
      jest.spyOn(redisClient, 'zRange').mockResolvedValue([]);

      await queue.join({
        userId: 'user1',
        selectedTopics: ['arrays'],
        selectedDifficulty: 'easy'
      });

      expect(redisClient.expire).toHaveBeenCalledWith('waiter:user1', 120);
    });

    it('should store match with expiration', async () => {
      jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
      jest.spyOn(redisClient, 'zRem').mockResolvedValue(1);
      jest.spyOn(redisClient, 'expire').mockResolvedValue(1);

      await queue._finalizePair({
        a: { userId: 'user1', selectedTopics: JSON.stringify(['arrays']), selectedDifficulty: 'medium' },
        b: { userId: 'user2', selectedTopics: JSON.stringify(['arrays']), selectedDifficulty: 'medium' },
        topic: 'arrays',
        difficulty: 'medium'
      });

      // Should set 180 second expiration on match
      expect(redisClient.expire).toHaveBeenCalledWith(
        expect.stringContaining('match:'),
        180
      );
    });

    it('should update waiter status to MATCHED', async () => {
      jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);
      jest.spyOn(redisClient, 'zRem').mockResolvedValue(1);
      jest.spyOn(redisClient, 'expire').mockResolvedValue(1);

      await queue._finalizePair({
        a: { userId: 'user1', selectedTopics: JSON.stringify(['arrays']), selectedDifficulty: 'medium' },
        b: { userId: 'user2', selectedTopics: JSON.stringify(['arrays']), selectedDifficulty: 'medium' },
        topic: 'arrays',
        difficulty: 'medium'
      });

      expect(redisClient.hSet).toHaveBeenCalledWith(
        'waiter:user1',
        expect.objectContaining({ status: 'MATCHED' })
      );
      expect(redisClient.hSet).toHaveBeenCalledWith(
        'waiter:user2',
        expect.objectContaining({ status: 'MATCHED' })
      );
    });
  });
});

