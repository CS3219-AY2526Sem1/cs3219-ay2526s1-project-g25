// src/services/redisClient.js
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: redisUrl.startsWith('rediss://'), // enable TLS for Upstash
  },
});

redisClient.on('connect', () => console.log('[Redis] Connected successfully'));
redisClient.on('ready', () => console.log('[Redis] Ready for commands'));
redisClient.on('error', (err) => console.error('[Redis] Error:', err));

// Connect only once
if (!redisClient.isOpen) {
  await redisClient.connect();
}
