import { writeFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';

/**
 * Run untrusted Python code in a short-lived Docker container with strict limits.
 * Requirements: Docker Engine running locally.
 */
export async function runPythonInDocker(code, {
  timeoutMs = 3000,
  memory = '256m',
  cpus = '0.5',
  outputLimit = 64 * 1024 // 64KB
} = {}) {
  // 1) Prepare ephemeral workspace
  const workdir = await mkdtemp(join(tmpdir(), 'exec-'));
  const codePath = join(workdir, 'main.py');
  await writeFile(codePath, String(code ?? ''), 'utf8');

  // 2) Build docker run args with tight sandbox flags
  const args = [
    'run', '--rm',
    '--network', 'none',            // no outbound network
    '--cpus', String(cpus),         // CPU cap
    '--memory', String(memory),     // RAM cap
    '--pids-limit', '64',           // process cap
    '--read-only',                  // read-only root FS
    '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
    '-v', `${workdir}:/work:ro`,    // mount code read-only
    '--security-opt', 'no-new-privileges',
    'python:3.11-alpine', 'python', '/work/main.py'
  ];

  const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  let stdout = '', stderr = '';
  let killedForOutput = false;
  const cap = (s) => s.length > outputLimit ? s.slice(0, outputLimit) : s;

  child.stdout.on('data', (b) => {
    stdout += b.toString();
    if (stdout.length > outputLimit) { stdout = cap(stdout); killedForOutput = true; child.kill('SIGKILL'); }
  });
  child.stderr.on('data', (b) => {
    stderr += b.toString();
    if (stderr.length > outputLimit) { stderr = cap(stderr); killedForOutput = true; child.kill('SIGKILL'); }
  });

  const result = await new Promise((resolve) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve({ code: null, signal: 'SIGKILL', timedOut: true }); }, timeoutMs);
    child.on('exit', (code, signal) => { clearTimeout(timer); resolve({ code, signal, timedOut: false }); });
    child.on('error', (err) => { clearTimeout(timer); resolve({ error: String(err) }); });
  });

  await rm(workdir, { recursive: true, force: true });

  return {
    stdout, stderr,
    exitCode: result.code,
    signal: result.signal || null,
    timedOut: result.timedOut || false,
    killedForOutput,
    error: result.error || null
  };
}
