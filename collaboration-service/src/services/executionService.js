import { randomUUID } from 'crypto';
import { runPythonInDocker } from './dockerExecutor.js';

export async function runOnce(sessionId, locks, logs, code, language) {
  if (locks.get(sessionId)) return { busy: true };
  locks.set(sessionId, true);
  try {
    let output;
    const isDocker = process.env.EXEC_MODE === 'docker';
    const isPython = String(language).toLowerCase() === 'python';

    if (isDocker && isPython) {
      const res = await runPythonInDocker(code, {
        timeoutMs: Number(process.env.EXEC_TIMEOUT_MS || 3000),
        memory: process.env.EXEC_MEMORY || '256m',
        cpus: process.env.EXEC_CPUS || '0.5'
      });
      if (res.error)       output = `[EXEC ERROR] ${res.error}`;
      else if (res.timedOut) output = '[TIMEOUT]';
      else {
        output = res.stderr?.trim()?.length ? res.stderr : res.stdout;
        if (!output || !output.trim()) output = '[NO OUTPUT]';
      }
    } else {
      // Fallback mock (your current behavior)
      await new Promise((r) => setTimeout(r, 200));
      output = `Echo(${language}): ${String(code || '').slice(0, 80)}`;
    }

    const runId = randomUUID();
    const ts = Date.now();
    const arr = logs.get(sessionId) ?? [];
    const run = { runId, output, ts };
    arr.push(run);
    logs.set(sessionId, arr);
    return { busy: false, run };
  } finally {
    locks.set(sessionId, false);
  }
}
