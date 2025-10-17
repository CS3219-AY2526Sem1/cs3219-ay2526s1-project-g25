// src/services/redisClient.js
import { createClient } from 'redis';

// Use environment variable if defined, otherwise fallback to local Redis
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create the Redis client
export const redisClient = createClient({
  url: redisUrl,
});

// Handle connection errors
redisClient.on('error', (err) => {
  console.error('[Redis] Error:', err);
});

// Handle connect/disconnect events
redisClient.on('connect', () => {
  console.log('[Redis] Connection established...');
});

redisClient.on('ready', () => {
  console.log('[Redis] Ready for commands');
});

redisClient.on('end', () => {
  console.log('[Redis] Connection closed');
});
