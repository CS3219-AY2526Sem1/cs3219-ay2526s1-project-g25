// src/repos/redisRepo.js
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("❌ Redis error:", err));

// ensure connection
await redisClient.connect();

export const redisRepo = {
  async setTempToken(tempKey, userId, ttlSeconds = 60) {
    //safe across Redis versions (Upstash too)
    await redisClient.set(`temp:${tempKey}`, String(userId), { EX: ttlSeconds });
  },

  async getTempToken(tempKey) {
    const val = await redisClient.get(`temp:${tempKey}`);
    if (val) await redisClient.del(`temp:${tempKey}`); // one-time use
    return val;
  },
};