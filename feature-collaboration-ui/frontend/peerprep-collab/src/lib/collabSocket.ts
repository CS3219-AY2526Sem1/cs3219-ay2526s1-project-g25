/*
 * AI-Assisted Notice:
 * Portions of this file were developed with assistance from ChatGPT, an AI language model created by OpenAI.
 * The AI provided suggestions and code snippets based on the prompts given by the author.
 * All AI-generated code was reviewed, tested, and validated by the author.
 */

export function connectCollabSocket(sessionId: string, userId: string, token: string, onMessage: (msg: any) => void, context: string = "Generic") {
    let wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL || "ws://localhost:3004/ws";
    if (!wsUrl.endsWith("/ws")) wsUrl = wsUrl.replace(/\/?$/, "/ws");

    const fullUrl = `${wsUrl}?sessionId=${sessionId}&userId=${userId}&token=${token}`;
        //console.log("[CollabSocket] Connecting to:", fullUrl);
        console.log(`[${context} via CollabSocket] Connecting to /ws`);

    const ws = new WebSocket(fullUrl);

    ws.onopen = (e) => {
        console.log(`[${context} via CollabSocket] WebSocket connected to /ws ✅`);
    };

    ws.onmessage = (e) => {
        console.log(`[${context} via CollabSocket] Message received:`, e.data);
        onMessage(JSON.parse(e.data));
    };

    ws.onclose = (evt) => {
        const { code, reason } = evt;
        const normal = code === 1000 || code === 1001; // normal close or page unload/HMR
        if (!normal) {
            console.warn(`[${context} via CollabSocket] WebSocket closed unexpectedly:`, code, reason);
        } else {
            console.log(`[${context} via CollabSocket] WebSocket closed normally.`);
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
        sendChatMessage,
    };
}
