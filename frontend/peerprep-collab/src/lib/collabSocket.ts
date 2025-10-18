export function connectCollabSocket(sessionId:string,userId:string,onMessage:(msg:any)=>void){
  const ws=new WebSocket(`${process.env.NEXT_PUBLIC_COLLAB_WS_URL}?sessionId=${sessionId}&userId=${userId}`);
  ws.onmessage=e=>{
    const msg = JSON.parse(e.data);
    console.log("🔵 WebSocket received:", msg.type, msg);
    onMessage(msg);
  };
  ws.onerror=e=>console.error('WS error',e);
  ws.onclose=()=>console.log('WS closed');
  ws.onopen=()=>console.log('✅ WS connected to:', process.env.NEXT_PUBLIC_COLLAB_WS_URL);
  const send=(data:any)=>{
    console.log("📤 WS sending:", data.type, data);
    return ws.readyState===1 && ws.send(JSON.stringify(data));
  };
  return {ws,send};
}
