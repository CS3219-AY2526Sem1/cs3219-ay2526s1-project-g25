export function connectCollabSocket(sessionId: string, userId: string, onMessage: (msg: any) => void) {
    let wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL || "ws://localhost:3004/ws";

    if (!wsUrl.endsWith("/ws")) wsUrl = wsUrl.replace(/\/?$/, "/ws");

    const fullUrl = `${wsUrl}?sessionId=${sessionId}&userId=${userId}`;
        console.log("[CollabSocket] Connecting to:", fullUrl);

    // const ws = new WebSocket(fullUrl);
    const token = (typeof window !== 'undefined') ? sessionStorage.getItem('collabToken') : null;
    const ws = new WebSocket(fullUrl, token ? ['bearer', token] : undefined);


    ws.onopen = (e) => {
        console.log("[CollabSocket] WebSocket opened successfully");
    };

    ws.onmessage = (e) => {
        console.log("[CollabSocket] Message received:", e.data);
        onMessage(JSON.parse(e.data));
    };

    ws.onclose = (evt) => {
        const { code, reason } = evt;
        const normal = code === 1000 || code === 1001; // normal close or page unload/HMR
        if (!normal) {
            console.warn("[CollabSocket] WebSocket closed unexpectedly:", code, reason);
        } else {
            console.log("[CollabSocket] WebSocket closed normally.");
        }
    };

    const send = (data: any) => {
        if (ws.readyState === 1) { ws.send(JSON.stringify(data)); }
    };

    // Execute code
    const executeCode = (language: string) => {
        send({
            type: "run:execute",
            language
        });
    };

    // Execute test cases
    const executeTestCases = (language: string, testCases: any[]) => {
        send({
            type: "run:testCases",
            language,
            testCases
        });
    };

    // Send cursor update
    const updateCursor = (cursor: any) => {
        send({
            type: "cursor:update",
            cursor
        });
    };

    // Send document operation
    const sendOperation = (operation: any) => {
        send({
            type: "doc:operation",
            operation
        });
    };

    // Send chat message
    const sendChatMessage = (text: string) => {
        send({
            type: "chat:message",
            text
        });
    };

    return { 
        ws, 
        send, 
        executeCode, 
        executeTestCases, 
        updateCursor, 
        sendOperation, 
        sendChatMessage 
    };
}
