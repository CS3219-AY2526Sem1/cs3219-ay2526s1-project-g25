export function connectCollabSocket(sessionId: string, userId: string, onMessage: (msg: any) => void) {
    const wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:3004/ws';
    const fullUrl = `${wsUrl}?sessionId=${sessionId}&userId=${userId}`;
    console.log('[CollabSocket] Connecting to WebSocket:', fullUrl);
    console.log('[CollabSocket] SessionId:', sessionId, 'UserId:', userId);
    
    const ws = new WebSocket(fullUrl);

    ws.onopen = (e) => {
        console.log("[CollabSocket] WebSocket opened successfully");
    };

    ws.onmessage = (e) => {
        console.log("[CollabSocket] Message received:", e.data);
        onMessage(JSON.parse(e.data));
    };

    ws.onerror = (e) => {
        console.error("[CollabSocket] WebSocket error:", e);
        console.error("[CollabSocket] Error details:", {
            readyState: ws.readyState,
            url: fullUrl,
            sessionId,
            userId
        });
    };

    ws.onclose = (e) => {
        console.log("[CollabSocket] WebSocket closed:", e.code, e.reason);
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
