export async function createSession(data:any){
  const baseUrl = process.env.NEXT_PUBLIC_COLLAB_BASE_URL || 'http://localhost:3004';
  console.log('[collabApi] Creating session with baseUrl:', baseUrl);
  const res = await fetch(`${baseUrl}/sessions`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  });
  return res.json();
}

export async function executeCode(sessionId:string, code:string, language:string){
  const baseUrl = process.env.NEXT_PUBLIC_COLLAB_BASE_URL || 'http://localhost:3004';
  console.log('[collabApi] Executing code with baseUrl:', baseUrl);
  const res = await fetch(`${baseUrl}/sessions/${sessionId}/execute`,{
      method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({code,language})
  });
  return res.json();
}