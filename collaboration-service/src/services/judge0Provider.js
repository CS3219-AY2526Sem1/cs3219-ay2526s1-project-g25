// If Node < 18: npm i node-fetch && uncomment:
// import fetch from 'node-fetch';

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const baseHost = new URL(JUDGE0_URL).host;
const isRapid = /rapidapi\.com/i.test(baseHost);

// Build headers from the base URL so Host always matches
const HEADERS = {
  'Content-Type': 'application/json',
  ...(isRapid ? {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': baseHost,
  } : {})
};

// --- TEMP DEBUG (remove after it works) ---
if (isRapid) {
  console.log('[judge0] using RapidAPI');
  console.log('[judge0] url=', JUDGE0_URL);
  console.log('[judge0] host header=', baseHost);
  console.log('[judge0] key present=', Boolean(process.env.RAPIDAPI_KEY));
}

// Map your supported languages to Judge0 language IDs (confirm with your instance /languages)
const LANG_MAP = {
  javascript: 63,  // Node.js 18
  typescript: 74,
  python: 71,      // Python 3.11
  java: 62,
  c: 50,
  cpp: 54,
  go: 60,
  rust: 73,
};

const b64 = (s='') => Buffer.from(s, 'utf8').toString('base64');
const fromB64 = (s='') => Buffer.from(s || '', 'base64').toString('utf8');

function langId(language) {
  const id = LANG_MAP[String(language || '').toLowerCase()];
  if (!id) throw new Error(`Unsupported language: ${language}`);
  return id;
}

export async function judge0Run({ code, language, stdin, timeoutMs }) {
  const payload = {
    language_id: langId(language),
    source_code: b64(code),
    stdin: stdin ? b64(stdin) : undefined,
  };

  const url = `${JUDGE0_URL}/submissions?base64_encoded=true&fields=stdout,stderr,status,exit_code,time,memory&wait=true`;

  // --- TEMP DEBUG (remove after it works) ---
  // sanity: show exactly what we send (without exposing the key)
  const debugHeaders = { ...HEADERS };
  if (debugHeaders['X-RapidAPI-Key']) debugHeaders['X-RapidAPI-Key'] = '***';
  console.log('[judge0] POST', url, debugHeaders);
  // ------------------------------------------

  const resp = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(payload) });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Judge0 ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const desc = data?.status?.description || '';

  const status =
    /Accepted|OK|Success/i.test(desc) ? 'finished' :
    /Time Limit Exceeded/i.test(desc) ? 'timeout' : 'error';

  return {
    status,
    stdout: fromB64(data.stdout),
    stderr: fromB64(data.stderr),
    exitCode: data.exit_code ?? undefined,
    time: data.time ? Number(data.time) : undefined,
    memory: data.memory ? Number(data.memory) : undefined,
    meta: { engine: 'judge0', statusDesc: desc },
  };
}