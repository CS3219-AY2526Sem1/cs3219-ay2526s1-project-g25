import { randomUUID } from "crypto";
import { redisRepo } from "../repos/redisRepo.js";

export async function createSession(data) {
  const s = {
    id: randomUUID(),
    startedAt: Date.now(),
    status: "active",
    ...data,
  };

  await redisRepo.setJson(`session:${s.id}`, s);
  await redisRepo.setJson(`document:${s.id}`, { version: 0, text: "" });
  await redisRepo.setJson(`presence:${s.id}`, {});
  await redisRepo.setJson(`runLogs:${s.id}`, []);
  await redisRepo.setJson(`chat:${s.id}`, []);

  return s;
}
