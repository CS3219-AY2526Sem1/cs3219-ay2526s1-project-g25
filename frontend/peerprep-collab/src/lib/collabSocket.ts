export function connectCollabSocket(sessionId: string, userId: string, onMessage: (msg: any) => void) {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_COLLAB_WS_URL}?sessionId=${sessionId}&userId=${userId}`);

    ws.onopen = (e) => {
        console.log("WS opened");
    };

    ws.onmessage = (e) => (
        onMessage(JSON.parse(e.data))
    );

    ws.onerror = (e) => {
        console.error("WS error", e);
    };

    ws.onclose = () => {
        console.log("WS closed");
    };

    const send = (data: any) => {
        if (ws.readyState === 1) { ws.send(JSON.stringify(data)); }
    };

    return { ws, send };
}
