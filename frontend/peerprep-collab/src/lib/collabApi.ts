export async function createSession(data:any){
  const res = await fetch(`${process.env.NEXT_PUBLIC_COLLAB_BASE_URL}/sessions`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  });
  return res.json();
}

export async function executeCode(sessionId:string, code:string, language:string){
  const res = await fetch(`${process.env.NEXT_PUBLIC_COLLAB_BASE_URL}/sessions/${sessionId}/execute`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({code,language})
  });
  return res.json();
}
