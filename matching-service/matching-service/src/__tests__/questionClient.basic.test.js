import { describe, it, expect } from '@jest/globals';

// Basic test for questionClient
describe('questionClient.js - Basic Tests', () => {
  it('should be able to import the module', async () => {
    const module = await import('../services/questionClient.js');
    expect(module).toBeDefined();
    expect(module.fetchRandomQuestion).toBeDefined();
    expect(typeof module.fetchRandomQuestion).toBe('function');
  });

  it('should have environment variables available', () => {
    expect(process.env).toBeDefined();
    // Environment variables are available in process.env
    expect(typeof process.env).toBe('object');
  });
});
