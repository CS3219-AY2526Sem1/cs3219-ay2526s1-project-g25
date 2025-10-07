// src/services/redisClient.js
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
});

redisClient.on('connect', () => console.log('[Redis] Connected successfully'));
redisClient.on('error', (err) => console.error('[Redis] Error:', err));

await redisClient.connect();
