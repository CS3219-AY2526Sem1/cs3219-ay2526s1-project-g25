import * as Y from "yjs";
import jwt from "jsonwebtoken";
import { redisRepo } from "../repos/redisRepo.js";

/**
 * Rooms: sessionId -> { doc: Y.Doc, conns: Set<WebSocket> }
 * Export it so other modules can access YJS documents
 */
export const rooms = new Map();

async function getRoom(sessionId) {
  let room = rooms.get(sessionId);
  if (!room) {
    const doc = new Y.Doc();
    
    // Load existing document from Redis if available
    try {
      const stored = await redisRepo.getJson(`collab:document:${sessionId}`);
      if (stored && stored.text) {
        // Use 'code' field to match CodePane
        let ytext;
        try {
          ytext = doc.getText('code');
        } catch (e) {
          ytext = doc.getText('monaco');
        }
        ytext.insert(0, stored.text);
        console.log(`[YJS Gateway] Loaded existing document for session ${sessionId} (length: ${stored.text.length})`);
      }
    } catch (err) {
      console.error('[YJS Gateway] Failed to load from Redis:', err);
    }
    
    // Set up document to sync to Redis - capture sessionId in closure
    let syncTimeout = null;
    const syncToRedis = (sessionIdParam) => {
      try {
        // Clear any pending sync
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }
        
        // Debounce: wait 500ms after last update before syncing to Redis
        syncTimeout = setTimeout(async () => {
          try {
            // Try 'code' first (as used by CodePane), then fallback to 'monaco'
            let ytext;
            try {
              ytext = doc.getText('code');
            } catch (e) {
              ytext = doc.getText('monaco');
            }
            const text = ytext.toString();
            
            // Save to Redis where AI controller and other services expect it
            await redisRepo.setJson(`collab:document:${sessionIdParam}`, {
              text: text,
              version: Date.now()
            });
            console.log(`[YJS Gateway] Synced YJS document to Redis for session ${sessionIdParam} (length: ${text.length})`);
          } catch (err) {
            console.error('[YJS Gateway] Failed to sync to Redis:', err);
          }
        }, 500); // Debounce for 500ms
      } catch (err) {
        console.error('[YJS Gateway] Failed to sync to Redis:', err);
      }
    };
    
    doc.on('update', (update, origin) => {
      if (origin !== 'redis') {
        // Sync to Redis for backward compatibility with other services (AI, test execution, etc.)
        // Use debounced sync to avoid too many Redis writes
        syncToRedis(sessionId);
      }
    });
    
    // Immediately sync on room creation to ensure any existing content is saved
    syncToRedis(sessionId);
    
    room = { doc, conns: new Set() };
    rooms.set(sessionId, room);
  }
  return room;
}

/**
 * Attach handlers to a WebSocketServer (from 'ws') configured on /ws-yjs
 * Contract:
 * - Server sends a FULL state update immediately on connect.
 * - Clients send/receive raw Yjs updates (Uint8Array) as binary frames.
 */
export function initYjsGateway(yws) {
  console.log("[YJS Gateway] Listening on /ws-yjs");
  yws.on("connection", async (ws, req) => {
    console.log("[YJS Gateway] New connection:", req.url);

    // 🔒 Verify JWT from query param ?t=<JWT>
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const token = searchParams.get("t");
    if (!token) {
      console.log("[YJS Gateway] Missing auth token");
      return ws.close(4001, "unauthorized");
    }
    try {
      const claims = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
      // Optional audience check if used when minting:
      // if (claims.aud !== "collaboration") return ws.close(4001, "wrong-audience");
      ws.user = { id: claims.userId, roles: claims.roles };
    } catch (e) {
      console.log("[YJS Gateway] JWT verify failed:", e?.message);
      return ws.close(4001, "unauthorized");
    }

    const sessionId = searchParams.get("sessionId") || "default";
    const userId = searchParams.get("userId") || "anon";

    const room = await getRoom(sessionId);
    room.conns.add(ws);

    // Send full current state to the new client
    const full = Y.encodeStateAsUpdate(room.doc);
    ws.send(full);

    // Receive Yjs updates from client
    ws.on("message", (data, isBinary) => {
      if (!isBinary) {
        // Handle text messages (e.g., session:end)
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "session:end") {
            console.log(`[YJS Gateway] ${userId} ended session ${sessionId}`);
            // Broadcast session:end to all clients in this room
            const payload = {
              type: "session:end",
              endedBy: userId,
              message: "Session has been ended by one of the participants.",
            };
            const payloadStr = JSON.stringify(payload);
            for (const client of room.conns) {
              if (client !== ws && client.readyState === 1) {
                client.send(payloadStr);
              }
            }
            return;
          }
        } catch (e) {
          // Not JSON, ignore
        }
        return; // ignore non-binary
      }
      const update = new Uint8Array(data);
      // Apply update to the room doc. Origin "remote" just as a tag.
      Y.applyUpdate(room.doc, update, "remote");
      console.log(`[YJS Gateway] Received and applied update for session ${sessionId}`);

      // Broadcast to all other peers in the same room
      for (const client of room.conns) {
        if (client !== ws && client.readyState === 1) {
          client.send(update);
        }
      }
    });

    ws.on("close", () => {
      room.conns.delete(ws);
      // Optional: cleanup empty rooms, or persist before disposing
      if (room.conns.size === 0) {
        // e.g., persist Y.encodeStateAsUpdate(room.doc) to Redis here
        // rooms.delete(sessionId); // if you want to drop from memory
      }
    });
  });
}
