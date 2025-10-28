import * as Y from 'yjs';

export class CollabWebSocketProvider {
  ws: WebSocket;
  ydoc: Y.Doc;
  sessionId: string;
  userId: string;
  connected: boolean = false;

  constructor(ws: WebSocket, ydoc: Y.Doc, sessionId: string, userId: string) {
    this.ws = ws;
    this.ydoc = ydoc;
    this.sessionId = sessionId;
    this.userId = userId;

    // Listen for messages from the server
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        // Handle Yjs updates from server
        if (msg.type === 'yjs:update' && msg.by !== this.userId) {
          const update = new Uint8Array(msg.update);
          Y.applyUpdate(this.ydoc, update, 'yjs-provider');
        }
      } catch (err) {
        console.error('[YjsProvider] Error handling message:', err);
      }
    };

    // Listen for Yjs document updates and send to server
    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      // Send all updates to server (except updates we received FROM server)
      if (origin !== 'yjs-provider' && this.ws.readyState === WebSocket.OPEN) {
        const updateArray = Array.from(update);
        console.log('[YjsProvider] Sending update to server:', updateArray.length, 'bytes');
        this.ws.send(JSON.stringify({
          type: 'yjs:update',
          update: updateArray,
          sessionId: this.sessionId,
          userId: this.userId
        }));
      }
    });

    // Mark as connected when WebSocket opens
    this.ws.onopen = () => {
      this.connected = true;
    };

    this.ws.onclose = () => {
      this.connected = false;
    };
  }

  disconnect() {
    this.ydoc.destroy();
    this.ws.close();
  }
}

/**
 * Create a Yjs WebSocket provider
 */
export function createYjsProvider(
  ws: WebSocket,
  ydoc: Y.Doc,
  sessionId: string,
  userId: string
): CollabWebSocketProvider {
  return new CollabWebSocketProvider(ws, ydoc, sessionId, userId);
}
