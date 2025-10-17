import { describe, it, expect } from '@jest/globals';
import { genId } from '../utils/id.js';

describe('id.js', () => {
  describe('genId', () => {
    it('should generate a valid UUID v4', () => {
      const id = genId();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs on multiple calls', () => {
      const id1 = genId();
      const id2 = genId();
      const id3 = genId();
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate string IDs', () => {
      const id = genId();
      
      expect(typeof id).toBe('string');
      expect(id.length).toBe(36); // UUID string length
    });
  });
});
