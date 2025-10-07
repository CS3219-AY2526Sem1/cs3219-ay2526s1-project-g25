import { randomUUID } from "crypto";
import { redisRepo } from "../repos/redisRepo.js";

export async function runOnce(sessionId, code, language) {
  const lockKey = `lock:${sessionId}`;
  const logKey = `runLogs:${sessionId}`;

  // Simple distributed lock check
  const locked = await redisRepo.get(lockKey);
  if (locked) return { busy: true };

  await redisRepo.set(lockKey, "1", 5); // 5 sec TTL

  try {
    // Simulated execution
    await new Promise((r) => setTimeout(r, 200));
    const runId = randomUUID();
    const ts = Date.now();
    const output = `Echo(${language}): ${String(code || "").slice(0, 80)}`;

    const run = { runId, output, ts };
    await redisRepo.pushToList(logKey, run);
    return { busy: false, run };
  } finally {
    await redisRepo.del(lockKey);
  }
}
