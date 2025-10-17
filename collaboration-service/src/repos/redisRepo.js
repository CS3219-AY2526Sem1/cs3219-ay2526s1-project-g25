import { redisClient } from '../services/redisClient.js';

// Helper functions to handle JSON
export const redisRepo = {
  async setJson(key, value, ttlSec = null) {
    const str = JSON.stringify(value);
    if (ttlSec) await redisClient.setEx(key, ttlSec, str);
    else await redisClient.set(key, str);
  },

  async getJson(key) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  async del(key) {
    await redisClient.del(key);
  },

  async pushToList(key, value) {
    await redisClient.rPush(key, JSON.stringify(value));
  },

 async getList(key) {
  try {
    const arr = await redisClient.lRange(key, 0, -1);
    return arr.map(JSON.parse);
  } catch (e) {
    // Handle wrong type or missing key
    if (e.message.includes("WRONGTYPE")) {
      const val = await redisClient.get(key);
      if (val) {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    }
    throw e;
  }
},


  async hSet(key, field, value) {
    await redisClient.hSet(key, field, JSON.stringify(value));
  },

  async hGetAllParsed(key) {
    const data = await redisClient.hGetAll(key);
    const parsed = {};
    for (const [f, v] of Object.entries(data)) parsed[f] = JSON.parse(v);
    return parsed;
  },
};
