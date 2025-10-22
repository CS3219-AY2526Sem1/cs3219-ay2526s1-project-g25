import { redisRepo } from "../repos/redisRepo.js";

export async function touchPresence(sessionId, userId, cursor) {
  const key = `presence:${sessionId}`;
  const p = (await redisRepo.getJson(key)) || {};
  p[userId] = { cursor, lastSeen: Date.now() };
  await redisRepo.setJson(key, p);
  return p;
}
