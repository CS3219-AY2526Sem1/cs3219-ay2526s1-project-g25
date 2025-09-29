
import { randomUUID } from 'crypto';

export async function runOnce(sessionId, locks, logs, code, language) {
  if (locks.get(sessionId)) return { busy: true };
  locks.set(sessionId, true);
  try {
    await new Promise((r) => setTimeout(r, 200));
    const runId = randomUUID();
    const ts = Date.now();
    const output = `Echo(${language}): ${String(code || '').slice(0, 80)}`;
    const arr = logs.get(sessionId) ?? [];
    arr.push({ runId, output, ts });
    logs.set(sessionId, arr);
    return { busy: false, run: { runId, output, ts } };
  } finally {
    locks.set(sessionId, false);
  }
}
