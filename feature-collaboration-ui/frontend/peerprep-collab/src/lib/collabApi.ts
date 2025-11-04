function getBase() {
  return process.env.NEXT_PUBLIC_COLLAB_BASE_URL || 'http://localhost:3004';
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('collabToken') || null;
}

function authHeader() {
  const t = getToken();
  return t ? { authorization: `Bearer ${t}` } : {};
}

export async function createSession(data: any) {
  const baseUrl = getBase();
  console.log('[collabApi] Creating session with baseUrl:', baseUrl);

  const res = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() } as HeadersInit,
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function executeCode(sessionId: string, code: string, language: string) {
  const baseUrl = getBase();
  console.log('[collabApi] Executing code with baseUrl:', baseUrl);

  const res = await fetch(`${baseUrl}/sessions/${sessionId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() } as HeadersInit,
    body: JSON.stringify({ code, language }),
  });
  return res.json();
}
