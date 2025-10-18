import { redisRepo } from "../repos/redisRepo.js";
import { applyOp } from "../services/documentService.js";
import { touchPresence } from "../services/presenceService.js";
import { generateAIResponse } from "../services/aiService.js";
import { z } from "zod";

// WebSocket rooms (in-memory connection maps; lightweight, ephemeral)
const wsRooms = new Map();

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

export function initGateway(wss) {
  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let sessionId = url.searchParams.get("sessionId") || "";
    let userId = url.searchParams.get("userId") || "";

    if (!sessionId) sessionId = String(req.headers["x-session-id"] || "");
    if (!userId) userId = String(req.headers["x-user-id"] || "");

    if (!sessionId || !userId) {
      return ws.close(1008, "missing params");
    }

    // Authorization check
    try {
      const allowed = await redisRepo.sIsMember(
        `collab:session:${sessionId}:participants`,
        userId
      );

      if (!allowed) {
        // Fallback: if the set doesn’t exist yet, fall back to session record
        const s = await redisRepo.getJson(`collab:session:${sessionId}`);
        const fallback =
          s && (userId === s.userA || userId === s.userB);

        if (!fallback) {
          console.warn(
            `[WS] denied join: user=${userId} not in session:${sessionId} participants`
          );
          return ws.close(1008, "unauthorized");
        }
      }
    } catch (err) {
      console.error("[WS] auth check failed:", err);
      return ws.close(1011, "auth check error");
    }

    if (!wsRooms.has(sessionId)) wsRooms.set(sessionId, new Set());
    wsRooms.get(sessionId).add(ws);

    console.log(`[WS] ${userId} connected to ${sessionId}`);

    const doc = (await redisRepo.getJson(`collab:document:${sessionId}`)) || { version: 0, text: "" };
    const chat = (await redisRepo.getList(`collab:chat:${sessionId}`)) || [];
    const aiChat = (await redisRepo.getList(`collab:ai-chat:${sessionId}`)) || [];

    ws.send(JSON.stringify({ type: "init", document: doc, chat, aiChat, message: "Connected successfully" }));

    ws.on("message", async (buf) => {
      try {
        const msg = JSON.parse(buf.toString());

        // ---- Document Operation ----
        if (msg.type === "doc:op") {
          const parsed = docOpSchema.safeParse(msg.op);
          if (!parsed.success) {
            return ws.send(JSON.stringify({ type: "error", error: parsed.error.issues }));
          }

          const raw = (await redisRepo.getJson(`collab:document:${sessionId}`)) || {};
          const liveDoc = {
            text: typeof raw.text === "string" ? raw.text : "",
            version: Number(raw.version ?? 0),
          };

          const clientVer = Number(parsed.data.version);
          if (!Number.isInteger(clientVer) || clientVer !== liveDoc.version) {
            console.log("[WS] doc:resync version check %d:%d", Number(parsed.data.version), Number(liveDoc.version));
            // send real snapshot so client can recover
            return ws.send(JSON.stringify({ type: "doc:resync", document: liveDoc }));
          }

          // apply locally (pure) and persist exactly once
          const updatedDoc = applyOp(liveDoc, parsed.data);
          await redisRepo.setJson(`collab:document:${sessionId}`, updatedDoc);

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

        // ---- Cursor Update ----
        if (msg.type === "cursor:update") {
          const p =
            (await redisRepo.getJson(`collab:presence:${sessionId}`)) || {};
          touchPresence(p, userId, msg.cursor);
          await redisRepo.setJson(`collab:presence:${sessionId}`, p);

          const payload = {
            type: "cursor:update",
            userId,
            cursor: msg.cursor,
          };
          broadcast(sessionId, payload, ws);
          return;
        }

        // ---- Run Code ----
        if (msg.type === "run:execute") {
          try {
            // const doc = (await redisRepo.getJson(`document:${sessionId}`)) || { text: "", version: 0 };
            let doc = await redisRepo.getJson(`collab:document:${sessionId}`);
            if (!doc) doc = await redisRepo.getJson(`document:${sessionId}`);
            if (!doc) doc = { text: "", version: 0 };
            const language = msg.language || "javascript"; // can be 'python', 'java', etc.

            // Call Judge0 directly
            const { judge0Run } = await import("../services/judge0Provider.js");
            const result = await judge0Run({ code: doc.text, language });

            // Store run logs (optional)
            await redisRepo.pushToList(`collab:runLogs:${sessionId}`, {
              userId,
              code: doc.text,
              language,
              output: result.stdout,
              ts: Date.now(),
            });

            // Broadcast result to all clients in the session
            const payload = {
              type: "run:result",
              run: {
                userId,
                language,
                output: result.stdout,
                error: result.stderr,
                status: result.status,
                time: result.time,
                memory: result.memory,
                ts: Date.now(),
              },
            };
            broadcast(sessionId, payload, null);
          } catch (err) {
            console.error("[WS run:execute]", err);
            ws.send(JSON.stringify({ type: "error", error: err.message }));
          }
          return;
        }

        // ---- Chat Message ----
        if (msg.type === "chat:message") {
          const chatMsg = { userId, text: msg.text, ts: Date.now() };
          await redisRepo.pushToList(`collab:chat:${sessionId}`, chatMsg);
          const payload = { type: "chat:message", ...chatMsg };
          broadcast(sessionId, payload, null);
          return;
        }

        // ---- AI Chat Message ----
        if (msg.type === "ai:message") {
          try {
            // Get current session data for context
            const session = await redisRepo.getJson(`collab:session:${sessionId}`);
            const doc = await redisRepo.getJson(`collab:document:${sessionId}`);
            
            // Build context
            const context = {
              code: doc?.text || "",
              language: msg.language || "python",
              error: msg.error || null,
            };

            // Add question context if available
            if (session) {
              context.question = {
                title: session.questionTitle || session.topic,
                description: session.questionDescription || "",
                difficulty: session.difficulty
              };
            }

            // Generate AI response
            const aiResponse = await generateAIResponse(sessionId, msg.text, context);

            // Store AI message
            const aiMsg = {
              userId: "ai-assistant",
              text: aiResponse,
              ts: Date.now(),
              type: "ai"
            };
            await redisRepo.pushToList(`collab:ai-chat:${sessionId}`, aiMsg);

            // Broadcast AI response to all users in the session
            const payload = { type: "ai:message", ...aiMsg };
            broadcast(sessionId, payload, null);
            return;
          } catch (error) {
            console.error("[WS Gateway] AI message error:", error);
            ws.send(JSON.stringify({ 
              type: "error", 
              error: "AI service error: " + error.message 
            }));
            return;
          }
        }

        ws.send(JSON.stringify({ type: "error", error: "unknown message type" }));
      } catch (e) {
        ws.send(JSON.stringify({ type: "error", error: e?.message || String(e) }));
      }
    });

    ws.on("close", () => {
      wsRooms.get(sessionId)?.delete(ws);
      console.log(`[WS] ${userId} disconnected from ${sessionId}`);
    });
  });
}

export function broadcast(sessionId, payload, exclude) {
  const room = wsRooms.get(sessionId);
  if (!room) return;
  for (const sock of room) {
    if (sock !== exclude && sock.readyState === sock.OPEN) {
      sock.send(JSON.stringify(payload));
    }
  }
}
