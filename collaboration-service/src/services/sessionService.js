import { randomUUID } from "crypto";
import { redisRepo } from "../repos/redisRepo.js";

export async function createSession(data) {
  const s = {
    id: randomUUID(),
    startedAt: Date.now(),
    status: "active",
    ...data,
  };

await redisRepo.setJson(`collab:session:${s.id}`, s);
await redisRepo.setJson(`collab:document:${s.id}`, { version: 0, text: "" });
await redisRepo.setJson(`collab:presence:${s.id}`, {});
await redisRepo.setJson(`collab:runLogs:${s.id}`, []);

  return s;
}
