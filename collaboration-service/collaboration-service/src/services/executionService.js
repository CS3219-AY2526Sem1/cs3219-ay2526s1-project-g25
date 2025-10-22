import { judge0Run } from './judge0Provider.js';

// Keep the same signature the rest of your app expects
export async function runOnce(sessionId, _cacheA, _cacheB, code, language, opts = {}) {
  const startedAt = Date.now();
  try {
    const exec = await judge0Run({
      code,
      language,
      stdin: opts.stdin,
      timeoutMs: opts.timeoutMs,
    });

    const run = {
      runId: `run_${Date.now()}`,
      status: exec.status,           // 'finished' | 'timeout' | 'error'
      output: exec.stdout || '',
      error: exec.stderr || '',
      meta: {
        ...exec.meta,
        exitCode: exec.exitCode,
        time: exec.time,
        memory: exec.memory,
        provider: 'judge0',
      },
      startedAt,
      finishedAt: Date.now(),
    };
    return { busy: false, run };
  } catch (e) {
    const run = {
      runId: `run_${Date.now()}`,
      status: 'error',
      output: '',
      error: e?.message || String(e),
      meta: { provider: 'judge0' },
      startedAt,
      finishedAt: Date.now(),
    };
    return { busy: false, run };
  }
}
