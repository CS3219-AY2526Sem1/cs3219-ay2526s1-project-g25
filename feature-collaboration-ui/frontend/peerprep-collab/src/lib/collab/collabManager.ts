// wrapper around websocket for monitoring external changes and updating doctext.
export function createCollabManager(socket: WebSocket) {
    let docText = "";
    let docVersion = 0;
    let remoteChangeCallback: ((text: string) => void) | null = null;

    socket.onmessage = (event) => {
        console.log(event.data);
        const msg = JSON.parse(event.data);

        if (msg.type === "doc:applied" || msg.type === "doc:resync") {
            docText = msg.document.text;
            docVersion = msg.document.version;
        }

        if (remoteChangeCallback) { remoteChangeCallback(docText); }
    }

    function onRemoteChange(callback: (text: string) => void) {
        remoteChangeCallback = callback;
    }

    function sendLocalChange(op: any) {
        console.log(JSON.stringify(op));
        socket.send(JSON.stringify(op));
    }

    function getText() {
        return docText;
    }

    function getVersion() {
        return docVersion;
    }

    return {
        onRemoteChange,
        sendLocalChange,
        getText,
        getVersion
    };
}
