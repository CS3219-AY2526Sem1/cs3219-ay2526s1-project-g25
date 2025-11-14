/*
 * AI-Assisted Notice:
 * Portions of this file were developed with assistance from ChatGPT, an AI language model created by OpenAI.
 * The AI provided suggestions and code snippets based on the prompts given by the author.
 * All AI-generated code was reviewed, tested, and validated by the author.
 */

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
  'python': 71,      // Python 3.8.1
  'javascript': 63,  // JavaScript (Node.js 12.14.0)
  'typescript': 74,  // TypeScript 3.7.4
  'java': 62,        // Java (OpenJDK 13.0.1)
  'cpp': 52,         // C++ (GCC 7.4.0)
  'c': 48,           // C (GCC 7.4.0)
  'csharp': 51,      // C# (Mono 6.6.0.161)
  'go': 60,          // Go 1.13.5
  'rust': 73,        // Rust 1.40.0
  'php': 68,         // PHP 7.4.1
  'ruby': 72,        // Ruby 2.7.0
  'swift': 83,       // Swift 5.2.3
  'kotlin': 78,      // Kotlin 1.3.70
  'scala': 81,       // Scala 2.13.2
  'perl': 85,        // Perl 5.28.1
  'r': 80,           // R 4.0.0
  'dart': 84,        // Dart 2.7.2
  'lua': 64,         // Lua 5.3.5
  'haskell': 61,     // Haskell (GHC 8.8.1)
  'clojure': 86,     // Clojure 1.10.1
  'elixir': 57,      // Elixir 1.9.4
  'erlang': 58,      // Erlang (OTP 22.2)
  'julia': 82,       // Julia 1.0.5
  'ocaml': 65,       // OCaml 4.09.0
  'fsharp': 87,      // F# 4.7
  'vbnet': 88,       // VB.NET 4.0.1
  'assembly': 45,    // Assembly (NASM 2.14.02)
  'bash': 46,        // Bash 5.0.0
  'basic': 47,       // Basic (FBC 1.07.1)
  'fortran': 59,     // Fortran (GFortran 9.2.0)
  'pascal': 67,      // Pascal (FPC 3.0.4)
  'prolog': 69,      // Prolog (GNU Prolog 1.4.5)
  'sql': 89,         // SQL (SQLite 3.27.2)
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