import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { nowMs } from '../utils/clock.js';

describe('clock.js', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('nowMs', () => {
    it('should return current timestamp in milliseconds', () => {
      const mockTime = 1234567890123;
      jest.setSystemTime(mockTime);
      
      const result = nowMs();
      
      expect(result).toBe(mockTime);
    });

    it('should return different timestamps when called at different times', () => {
      const firstTime = 1234567890123;
      const secondTime = 1234567890124;
      
      jest.setSystemTime(firstTime);
      const firstResult = nowMs();
      
      jest.setSystemTime(secondTime);
      const secondResult = nowMs();
      
      expect(firstResult).toBe(firstTime);
      expect(secondResult).toBe(secondTime);
      expect(secondResult).toBeGreaterThan(firstResult);
    });
  });
});
