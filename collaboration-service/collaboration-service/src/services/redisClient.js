// src/services/redisClient.js
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("Redis URL missing from environment variables");
  throw new Error("REDIS_URL environment variable is required");
}

// Determine if we need TLS based on the URL protocol
const isSecure = redisUrl && redisUrl.startsWith('rediss://');

// Configure Redis client based on URL protocol
const clientConfig = {
  url: redisUrl,
};

// Only add socket configuration if using secure connection
if (isSecure) {
  clientConfig.socket = {
    tls: true,
    rejectUnauthorized: false,
  };
}

export const redisClient = createClient(clientConfig);

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
