import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { initController, joinQueue, leaveQueue, getStatus, handleDisconnect } from '../controllers/matchController.js';

describe('matchController.js', () => {
  let mockQueue, req, res;

  beforeEach(() => {
    mockQueue = {
      join: jest.fn(),
      leave: jest.fn(),
      getStatus: jest.fn(),
      handleDisconnect: jest.fn()
    };

    req = { body: {}, params: {} };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initController', () => {
    it('should set queueRef to the provided matchQueue', () => {
      initController(mockQueue);
      // We can't directly test queueRef since it's not exported, but we can test behavior
      // by calling other functions that use queueRef
    });
  });

  describe('joinQueue', () => {
    beforeEach(() => {
      initController(mockQueue);
    });

    it('should successfully join queue and return result', async () => {
      const mockResult = { status: 'queued', userId: 'user123' };
      mockQueue.join.mockResolvedValue(mockResult);

      req.body = {
        userId: 'user123',
        topics: ['arrays'],
        difficulty: 'medium'
      };

      await joinQueue(req, res);

      expect(mockQueue.join).toHaveBeenCalledWith({
        userId: 'user123',
        selectedTopics: ['arrays'],
        selectedDifficulty: 'medium'
      });
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle successful match', async () => {
      const mockResult = { 
        status: 'matched', 
        match: { matchId: 'match123', userA: 'user123', userB: 'user456' }
      };
      mockQueue.join.mockResolvedValue(mockResult);

      req.body = {
        userId: 'user123',
        topics: ['arrays'],
        difficulty: 'medium'
      };

      await joinQueue(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle queue errors and return 500', async () => {
      const error = new Error('Queue service error');
      mockQueue.join.mockRejectedValue(error);

      req.body = {
        userId: 'user123',
        topics: ['arrays'],
        difficulty: 'medium'
      };

      await joinQueue(req, res);

      expect(console.error).toHaveBeenCalledWith('[joinQueue] Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Queue service error'
      });
    });

    it('should handle errors without message property', async () => {
      const error = { toString: () => 'Custom error' };
      mockQueue.join.mockRejectedValue(error);

      req.body = {
        userId: 'user123',
        topics: ['arrays'],
        difficulty: 'medium'
      };

      await joinQueue(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: undefined
      });
    });
  });

  describe('leaveQueue', () => {
    beforeEach(() => {
      initController(mockQueue);
    });

    it('should successfully leave queue and return result', async () => {
      const mockResult = { removed: true };
      mockQueue.leave.mockResolvedValue(mockResult);

      req.body = { userId: 'user123' };

      await leaveQueue(req, res);

      expect(mockQueue.leave).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle leave errors and return 500', () => {
      const error = new Error('Leave service error');
      mockQueue.leave.mockImplementation(() => {
        throw error;
      });

      req.body = { userId: 'user123' };

      leaveQueue(req, res);

      expect(console.error).toHaveBeenCalledWith('[leaveQueue] Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Leave service error'
      });
    });

    it('should handle non-Error exceptions', () => {
      const error = 'String error';
      mockQueue.leave.mockImplementation(() => {
        throw error;
      });

      req.body = { userId: 'user123' };

      leaveQueue(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: undefined
      });
    });
  });

  describe('getStatus', () => {
    beforeEach(() => {
      initController(mockQueue);
    });

    it('should return status when user is found', async () => {
      const mockResult = { status: 'WAITING', userId: 'user123' };
      mockQueue.getStatus.mockResolvedValue(mockResult);

      req.params = { userId: 'user123' };

      await getStatus(req, res);

      expect(mockQueue.getStatus).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when user is not found', async () => {
      const mockResult = { status: 'NOT_FOUND' };
      mockQueue.getStatus.mockResolvedValue(mockResult);

      req.params = { userId: 'user123' };

      await getStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle getStatus errors and return 500', () => {
      const error = new Error('Status service error');
      mockQueue.getStatus.mockImplementation(() => {
        throw error;
      });

      req.params = { userId: 'user123' };

      getStatus(req, res);

      expect(console.error).toHaveBeenCalledWith('[getStatus] Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Status service error'
      });
    });

    it('should handle different status types', async () => {
      const statuses = ['WAITING', 'MATCHED', 'TIMED_OUT', 'SOLO'];
      
      for (const status of statuses) {
        const mockResult = { status, userId: 'user123' };
        mockQueue.getStatus.mockResolvedValue(mockResult);

        req.params = { userId: 'user123' };

        await getStatus(req, res);

        if (status === 'NOT_FOUND') {
          expect(res.status).toHaveBeenCalledWith(404);
        } else {
          expect(res.json).toHaveBeenCalledWith(mockResult);
        }

        // Reset mocks for next iteration
        res.status.mockClear();
        res.json.mockClear();
      }
    });
  });

  describe('handleDisconnect', () => {
    beforeEach(() => {
      initController(mockQueue);
    });

    it('should successfully handle disconnect and return result', async () => {
      const mockResult = { ok: true, mode: 'SOLO' };
      mockQueue.handleDisconnect.mockResolvedValue(mockResult);

      req.body = {
        matchId: 'match123',
        remainingUserId: 'user123',
        action: 'solo'
      };

      await handleDisconnect(req, res);

      expect(mockQueue.handleDisconnect).toHaveBeenCalledWith({
        matchId: 'match123',
        remainingUserId: 'user123',
        action: 'solo'
      });
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when result is not ok', async () => {
      const mockResult = { ok: false, error: 'MATCH_NOT_ACTIVE' };
      mockQueue.handleDisconnect.mockResolvedValue(mockResult);

      req.body = {
        matchId: 'invalid',
        remainingUserId: 'user123',
        action: 'solo'
      };

      await handleDisconnect(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle disconnect errors and return 500', () => {
      const error = new Error('Disconnect service error');
      mockQueue.handleDisconnect.mockImplementation(() => {
        throw error;
      });

      req.body = {
        matchId: 'match123',
        remainingUserId: 'user123',
        action: 'solo'
      };

      handleDisconnect(req, res);

      expect(console.error).toHaveBeenCalledWith('[handleDisconnect] Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Disconnect service error'
      });
    });

    it('should handle requeue action', async () => {
      const mockResult = { ok: true, mode: 'REQUEUED', expiresAt: 1234567890 };
      mockQueue.handleDisconnect.mockResolvedValue(mockResult);

      req.body = {
        matchId: 'match123',
        remainingUserId: 'user123',
        action: 'requeue'
      };

      await handleDisconnect(req, res);

      expect(mockQueue.handleDisconnect).toHaveBeenCalledWith({
        matchId: 'match123',
        remainingUserId: 'user123',
        action: 'requeue'
      });
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
