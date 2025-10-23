// src/services/redisClient.js
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("Redis URL missing from environment variables");
  throw new Error("REDIS_URL environment variable is required");
}

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: redisUrl?.startsWith('rediss://'), // enable TLS for Upstash
  },
});

redisClient.on('connect', () => console.log('[Redis] Connected successfully'));
redisClient.on('ready', () => console.log('[Redis] Ready for commands'));
redisClient.on('error', (err) => console.error('[Redis] Error:', err));

// Connect to Redis
let isConnected = false;
export async function connectRedis() {
  if (!isConnected && !redisClient.isOpen) {
    await redisClient.connect();
    isConnected = true;
  }
}
