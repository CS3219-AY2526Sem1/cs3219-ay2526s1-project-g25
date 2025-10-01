import { documents, presence, wsRooms } from '../repos/memoryRepo.js';
import { getOrCreateDoc, applyOp } from '../services/documentService.js';
import { touchPresence } from "../services/presenceService.js";
import { z } from 'zod';

/**
 * Message schema for document ops.
 */
const docOpSchema = z.union([
  z.object({
    type: z.literal('insert'),
    index: z.number().int().nonnegative(),
    text: z.string(),
    version: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('delete'),
    index: z.number().int().nonnegative(),
    length: z.number().int().nonnegative(),
    version: z.number().int().nonnegative(),
  }),
]);

/**
 * Initialize WebSocket gateway.
 * Supports:
 *  - Query params:  ws://.../ws?sessionId=SID&userId=UID
 *  - Headers:       x-session-id: SID, x-user-id: UID
 *
 * NOTE: Using path params like /ws/SID/UID would require
 * removing `path: '/ws'` from WebSocketServer in src/index.js,
 * since ws enforces exact path matching when `path` is set.
 */
export function initGateway(wss) {
  wss.on('connection', (ws, req) => {
    // Try query params first
    const url = new URL(req.url, `http://${req.headers.host}`);
    let sessionId = url.searchParams.get('sessionId') || '';
    let userId = url.searchParams.get('userId') || '';

    // Fallback to headers (PowerShell-safe)
    if (!sessionId) sessionId = String(req.headers['x-session-id'] || '');
    if (!userId)    userId    = String(req.headers['x-user-id']   || '');

    if (!sessionId || !userId) {
      // Policy violation: missing required identifiers
      return ws.close(1008, 'missing params');
    }

    // Room setup
    if (!wsRooms.has(sessionId)) wsRooms.set(sessionId, new Set());
    wsRooms.get(sessionId).add(ws);

    // Send initial document snapshot
    const doc = getOrCreateDoc(documents, sessionId);
    ws.send(JSON.stringify({ type: 'doc:init', document: doc }));

    // Handle messages
    ws.on('message', (buf) => {
      try {
        const msg = JSON.parse(buf.toString());

        if (msg.type === 'doc:op') {
          const parsed = docOpSchema.safeParse(msg.op);
          if (!parsed.success) {
            return ws.send(JSON.stringify({ type: 'error', error: parsed.error.issues }));
          }

          const liveDoc = getOrCreateDoc(documents, sessionId);

          // Simple version check (optimistic concurrency)
          if (parsed.data.version !== liveDoc.version) {
            // Ask client to resync with the current doc
            return ws.send(JSON.stringify({ type: 'doc:resync', document: liveDoc }));
          }

          // Apply and broadcast the op
          const after = applyOp(liveDoc, parsed.data);
          const payload = { type: 'doc:applied', document: after, op: parsed.data, by: userId };

          broadcast(sessionId, payload, ws);      // others
          ws.send(JSON.stringify(payload));       // echo to sender
          return;
        }

        if (msg.type === 'cursor:update') {
          const p = presence.get(sessionId) ?? new Map();
          touchPresence(p, userId, msg.cursor);
          presence.set(sessionId, p);

          const payload = { type: 'cursor:update', userId, cursor: msg.cursor };
          broadcast(sessionId, payload, ws);      // others only
          return;
        }

        // Unknown message type
        ws.send(JSON.stringify({ type: 'error', error: 'unknown message type' }));
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', error: e?.message || String(e) }));
      }
    });

    ws.on('close', () => {
      wsRooms.get(sessionId)?.delete(ws);
    });
  });
}

/**
 * Broadcast to all sockets in a room except `exclude`.
 */
function broadcast(sessionId, payload, exclude) {
  const room = wsRooms.get(sessionId);
  if (!room) return;
  for (const sock of room) {
    if (sock !== exclude && sock.readyState === sock.OPEN) {
      sock.send(JSON.stringify(payload));
    }
  }
}
