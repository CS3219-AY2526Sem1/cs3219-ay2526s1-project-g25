import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { validateDisconnectAction } from '../middleware/validateDisconnectAction.js';

describe('validateDisconnectAction.js', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('validateDisconnectAction', () => {
    it('should pass validation with valid solo action', () => {
      req.body = {
        matchId: 'match123',
        remainingUserId: 'user123',
        action: 'solo'
      };

      validateDisconnectAction(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass validation with valid requeue action', () => {
      req.body = {
        matchId: 'match123',
        remainingUserId: 'user123',
        action: 'requeue'
      };

      validateDisconnectAction(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing matchId', () => {
      req.body = {
        remainingUserId: 'user123',
        action: 'solo'
      };

      validateDisconnectAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['matchId is required']
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject missing remainingUserId', () => {
      req.body = {
        matchId: 'match123',
        action: 'solo'
      };

      validateDisconnectAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['remainingUserId is required']
      });
    });

    it('should reject invalid action', () => {
      req.body = {
        matchId: 'match123',
        remainingUserId: 'user123',
        action: 'invalid'
      };

      validateDisconnectAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['action must be one of: solo, requeue']
      });
    });

    it('should reject missing action', () => {
      req.body = {
        matchId: 'match123',
        remainingUserId: 'user123'
      };

      validateDisconnectAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['action must be one of: solo, requeue']
      });
    });

    it('should handle multiple validation errors', () => {
      req.body = {
        matchId: '',
        remainingUserId: '',
        action: 'invalid'
      };

      validateDisconnectAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: [
          'matchId is required',
          'remainingUserId is required',
          'action must be one of: solo, requeue'
        ]
      });
    });

    it('should accept empty string values as missing', () => {
      req.body = {
        matchId: '',
        remainingUserId: 'user123',
        action: 'solo'
      };

      validateDisconnectAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['matchId is required']
      });
    });

    it('should accept null values as missing', () => {
      req.body = {
        matchId: 'match123',
        remainingUserId: null,
        action: 'solo'
      };

      validateDisconnectAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['remainingUserId is required']
      });
    });

    it('should accept undefined values as missing', () => {
      req.body = {
        matchId: 'match123',
        remainingUserId: 'user123',
        action: undefined
      };

      validateDisconnectAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: ['action must be one of: solo, requeue']
      });
    });
  });
});
