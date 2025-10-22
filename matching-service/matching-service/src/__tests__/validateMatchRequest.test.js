import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { validateJoin, validateLeave } from '../middleware/validateMatchRequest.js';

describe('validateMatchRequest.js', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('validateJoin', () => {
    it('should pass validation with valid request', () => {
      req.body = {
        userId: 'user123',
        topics: ['arrays', 'strings'],
        difficulty: 'medium'
      };

      validateJoin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing userId', () => {
      req.body = {
        topics: ['arrays'],
        difficulty: 'easy'
      };

      validateJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['userId (string) is required']
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-string userId', () => {
      req.body = {
        userId: 123,
        topics: ['arrays'],
        difficulty: 'easy'
      };

      validateJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['userId (string) is required']
      });
    });

    it('should reject empty topics array', () => {
      req.body = {
        userId: 'user123',
        topics: [],
        difficulty: 'easy'
      };

      validateJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['topics must be a non-empty array with at most 5 values']
      });
    });

    it('should reject non-array topics', () => {
      req.body = {
        userId: 'user123',
        topics: 'arrays',
        difficulty: 'easy'
      };

      validateJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['topics must be a non-empty array with at most 5 values']
      });
    });

    it('should reject topics array with more than 5 items', () => {
      req.body = {
        userId: 'user123',
        topics: ['arrays', 'strings', 'trees', 'graphs', 'dp', 'math'],
        difficulty: 'easy'
      };

      validateJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['topics must be a non-empty array with at most 5 values']
      });
    });

    it('should reject invalid difficulty', () => {
      req.body = {
        userId: 'user123',
        topics: ['arrays'],
        difficulty: 'expert'
      };

      validateJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['difficulty must be one of: easy, medium, hard']
      });
    });

    it('should reject missing difficulty', () => {
      req.body = {
        userId: 'user123',
        topics: ['arrays']
      };

      validateJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['difficulty must be one of: easy, medium, hard']
      });
    });

    it('should handle multiple validation errors', () => {
      req.body = {
        userId: 123,
        topics: [],
        difficulty: 'expert'
      };

      validateJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: [
          'userId (string) is required',
          'topics must be a non-empty array with at most 5 values',
          'difficulty must be one of: easy, medium, hard'
        ]
      });
    });

    it('should accept all valid difficulties', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      
      difficulties.forEach(difficulty => {
        req.body = {
          userId: 'user123',
          topics: ['arrays'],
          difficulty
        };

        validateJoin(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        
        // Reset mocks for next iteration
        next.mockClear();
        res.status.mockClear();
        res.json.mockClear();
      });
    });
  });

  describe('validateLeave', () => {
    it('should pass validation with valid userId', () => {
      req.body = { userId: 'user123' };

      validateLeave(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing userId', () => {
      req.body = {};

      validateLeave(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'userId (string) is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-string userId', () => {
      req.body = { userId: 123 };

      validateLeave(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'userId (string) is required'
      });
    });

    it('should reject empty string userId', () => {
      req.body = { userId: '' };

      validateLeave(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'userId (string) is required'
      });
    });
  });
});
