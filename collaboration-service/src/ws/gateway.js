import { redisRepo } from "../repos/redisRepo.js";
import { applyOp } from "../services/documentService.js";
import { touchPresence } from "../services/presenceService.js";
import { z } from "zod";

// WebSocket rooms (in-memory connection maps; lightweight, ephemeral)
const wsRooms = new Map();

/**
 * Schema for document operations
 */
const docOpSchema = z.union([
  z.object({
    type: z.literal("insert"),
    index: z.number().int().nonnegative(),
    text: z.string(),
    version: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("delete"),
    index: z.number().int().nonnegative(),
    length: z.number().int().nonnegative(),
    version: z.number().int().nonnegative(),
  }),
]);

/**
 * Initialize WebSocket gateway
 * Handles: document edits, cursor updates, and chat messages
 */
export function initGateway(wss) {
  wss.on("connection", async (ws, req) => {
    // Parse sessionId and userId from query params or headers
    const url = new URL(req.url, `http://${req.headers.host}`);
    let sessionId = url.searchParams.get("sessionId") || "";
    let userId = url.searchParams.get("userId") || "";

    if (!sessionId)
      sessionId = String(req.headers["x-session-id"] || "");
    if (!userId) userId = String(req.headers["x-user-id"] || "");

    if (!sessionId || !userId) {
      return ws.close(1008, "missing params");
    }

    // Add socket to room
    if (!wsRooms.has(sessionId)) wsRooms.set(sessionId, new Set());
    wsRooms.get(sessionId).add(ws);

    console.log(`[WS] ${userId} connected to ${sessionId}`);

    // Load existing document + chat state
    const doc = (await redisRepo.getJson(`document:${sessionId}`)) || {
      version: 0,
      text: "",
    };
    const chat = (await redisRepo.getList(`chat:${sessionId}`)) || [];

    // Send initial state to client
    ws.send(
      JSON.stringify({
        type: "init",
        document: doc,
        chat,
        message: "Connected successfully",
      })
    );

    // Handle incoming messages
    ws.on("message", async (buf) => {
      try {
        const msg = JSON.parse(buf.toString());

        /**
         * ---- Document Operation ----
         */
        if (msg.type === "doc:op") {
          const parsed = docOpSchema.safeParse(msg.op);
          if (!parsed.success) {
            return ws.send(
              JSON.stringify({
                type: "error",
                error: parsed.error.issues,
              })
            );
          }

          const liveDoc =
            (await redisRepo.getJson(`document:${sessionId}`)) || {
              version: 0,
              text: "",
            };

          if (parsed.data.version !== liveDoc.version) {
            return ws.send(
              JSON.stringify({
                type: "doc:resync",
                document: liveDoc,
              })
            );
          }

          const updatedDoc = applyOp(liveDoc, parsed.data);
          await redisRepo.setJson(`document:${sessionId}`, updatedDoc);

          const payload = {
            type: "doc:applied",
            document: updatedDoc,
            op: parsed.data,
            by: userId,
          };

          broadcast(sessionId, payload, ws);
          ws.send(JSON.stringify(payload));
          return;
        }

        /**
         * ---- Cursor Update ----
         */
        if (msg.type === "cursor:update") {
          const p =
            (await redisRepo.getJson(`presence:${sessionId}`)) || {};
          touchPresence(p, userId, msg.cursor);
          await redisRepo.setJson(`presence:${sessionId}`, p);

          const payload = {
            type: "cursor:update",
            userId,
            cursor: msg.cursor,
          };
          broadcast(sessionId, payload, ws);
          return;
        }

        /**
         * ---- Chat Message ----
         */
        if (msg.type === "chat:message") {
          const chatMsg = {
            userId,
            text: msg.text,
            ts: Date.now(),
          };
          await redisRepo.pushToList(`chat:${sessionId}`, chatMsg);
          const payload = { type: "chat:message", ...chatMsg };
          broadcast(sessionId, payload, null);
          return;
        }

        /**
         * ---- Unknown ----
         */
        ws.send(
          JSON.stringify({ type: "error", error: "unknown message type" })
        );
      } catch (e) {
        ws.send(
          JSON.stringify({ type: "error", error: e?.message || String(e) })
        );
      }
    });

    // Cleanup on disconnect
    ws.on("close", () => {
      wsRooms.get(sessionId)?.delete(ws);
      console.log(`[WS] ${userId} disconnected from ${sessionId}`);
    });
  });
}

/**
 * Broadcast a payload to all sockets in a room except `exclude`
 */
export function broadcast(sessionId, payload, exclude) {
  const room = wsRooms.get(sessionId);
  if (!room) return;
  for (const sock of room) {
    if (sock !== exclude && sock.readyState === sock.OPEN) {
      sock.send(JSON.stringify(payload));
    }
  }
}
