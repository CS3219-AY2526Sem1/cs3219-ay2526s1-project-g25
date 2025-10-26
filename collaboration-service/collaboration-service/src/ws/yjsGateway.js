// src/ws/yjsGateway.js
import * as Y from "yjs";

/**
 * Rooms: sessionId -> { doc: Y.Doc, conns: Set<WebSocket> }
 */
const rooms = new Map();

function getRoom(sessionId) {
  let room = rooms.get(sessionId);
  if (!room) {
    const doc = new Y.Doc();
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
  yws.on("connection", (ws, req) => {
    console.log("[YJS Gateway] New connection:", req.url);
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = searchParams.get("sessionId") || "default";
    const userId = searchParams.get("userId") || "anon";

    const room = getRoom(sessionId);
    room.conns.add(ws);

    // Send full current state to the new client
    const full = Y.encodeStateAsUpdate(room.doc);
    ws.send(full);

    // Receive Yjs updates from client
    ws.on("message", (data, isBinary) => {
      if (!isBinary) return; // ignore non-binary (e.g., legacy JSON pings)
      const update = new Uint8Array(data);
      // Apply update to the room doc. Origin "remote" just as a tag.
      Y.applyUpdate(room.doc, update, "remote");

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
