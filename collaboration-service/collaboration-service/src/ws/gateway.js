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
    console.log("[WS] New connection attempt from:", req.headers.origin);
    const url = new URL(req.url, `http://${req.headers.host}`);
    let sessionId = url.searchParams.get("sessionId") || "";
    let userId = url.searchParams.get("userId") || "";

    console.log("[WS] Extracted params - sessionId:", sessionId, "userId:", userId);

    if (!sessionId) sessionId = String(req.headers["x-session-id"] || "");
    if (!userId) userId = String(req.headers["x-user-id"] || "");

    if (!sessionId || !userId) {
      console.log("[WS] Missing params - closing connection");
      return ws.close(1008, "missing params");
    }

    // Authorization check
    try {
      console.log("[WS] Checking authorization for user:", userId, "session:", sessionId);
      const allowed = await redisRepo.sIsMember(
        `collab:session:${sessionId}:participants`,
        userId
      );

      console.log("[WS] Redis participants check result:", allowed);

      if (!allowed) {
        // Fallback: if the set doesn't exist yet, fall back to session record
        const s = await redisRepo.getJson(`collab:session:${sessionId}`);
        console.log("[WS] Fallback session check - session data:", s);
        const fallback =
          s && (userId === s.userA || userId === s.userB);

        console.log("[WS] Fallback check result:", fallback);

        if (!fallback) {
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
        console.log(`[WS] Received message from user ${userId} (session ${sessionId}):`, JSON.stringify(msg).slice(0, 200));

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
            console.log(`[WS run:execute] Received execution request for session ${sessionId} (user ${userId}), language=${msg.language}`);
            // const doc = (await redisRepo.getJson(`document:${sessionId}`)) || { text: "", version: 0 };
            let doc = await redisRepo.getJson(`collab:document:${sessionId}`);
            if (!doc) doc = await redisRepo.getJson(`document:${sessionId}`);
            if (!doc) doc = { text: "", version: 0 };
            const language = msg.language || "javascript"; // can be 'python', 'java', etc.

            // Call Judge0 directly
            const { judge0Run } = await import("../services/judge0Provider.js");
            console.log("[run:execute] Code snippet:");
            console.log(doc.text.slice(0, 200));
            const result = await judge0Run({ code: doc.text, language });
            console.log("[run:execute] Judge0 result:", result);

            // Store run logs (optional)
            await redisRepo.pushToList(`collab:runLogs:${sessionId}`, {
              userId,
              code: doc.text,
              language,
              output: result.stdout,
              ts: Date.now(),
            });

            // Broadcast result to all clients in the session
            console.log(`[run:execute] Broadcasting run:result to all clients in session ${sessionId}`);
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

        // ---- Run Test Cases ----
        if (msg.type === "run:testCases") {
          try {
            console.log(`[WS run:testCases] Starting test execution for session ${sessionId}, user ${userId}`);

            // (A) Immediately ACK the caller so the UI knows the backend received it
            ws.send(JSON.stringify({ type: "run:testStarted", ts: Date.now() }));

            // Load service (and fail safely)
            let testExecutionService;
            try {
              ({ testExecutionService } = await import("../services/testExecutionService.js"));
            } catch (e) {
              console.error("[WS run:testCases] Could not load testExecutionService:", e);
              // Fallback: run each case with judge0 directly
              const { judge0Run } = await import("../services/judge0Provider.js");
              testExecutionService = {
                async executeTestCases(code, language, cases, opts) {
                  const results = [];
                  for (const tc of cases) {
                    const input = tc.input ?? "";
                    const expected = (tc.output ?? tc.expected ?? "").trim();
                    const r = await judge0Run({ code, language, stdin: input, timeoutMs: opts?.timeoutMs, memoryLimit: opts?.memoryLimit });
                    const actual = (r.stdout ?? "").trim();
                    results.push({
                      input,
                      output: actual,
                      expected,
                      status: actual === expected ? "pass" : "fail",
                    });
                  }
                  return {
                    totalTests: results.length,
                    passedTests: results.filter(x => x.status === "pass").length,
                    failedTests: results.filter(x => x.status !== "pass").length,
                    testResults: results,
                    executionTime: 0,
                    language,
                    timestamp: Date.now(),
                  };
                }
              };
            }

            // // (B) Get code
            // let doc = await redisRepo.getJson(`collab:document:${sessionId}`);
            // if (!doc) doc = await redisRepo.getJson(`document:${sessionId}`);
            // if (!doc) doc = { text: "", version: 0 };

            // const language = msg.language || "javascript";

            // (B) Resolve code: prefer client payload, fallback to Redis
            const language = msg.language || "javascript";
            let code = typeof msg.code === "string" ? msg.code : "";
            if (!code.trim()) {
            let doc = await redisRepo.getJson(`collab:document:${sessionId}`);
            if (!doc) doc = await redisRepo.getJson(`document:${sessionId}`);
            code = (doc?.text || "");
            }
            console.log(`[WS run:testCases] language=${language} codeLen=${code.length}`);
        
            // Guard: if code empty, do not run
            if (!code.trim()) {
              const emptySrc = {
                type: "run:testResults",
                testResults: {
                  userId,
                  language,
                  results: {
                    totalTests: 0, passedTests: 0, failedTests: 0,
                    testResults: [],
                    executionTime: 0,
                    language, timestamp: Date.now(),
                  },
                  ts: Date.now(),
                  error: "No code to execute."
                },
              };
              try { ws.send(JSON.stringify(emptySrc)); } catch {}
              broadcast(sessionId, emptySrc, null);
              return;
            }

            const testCases = msg.testCases || [];
            if (testCases.length === 0) {
              const emptyPayload = {
                type: "run:testResults",
                testResults: {
                  userId,
                  language,
                  results: {
                    totalTests: 0, passedTests: 0, failedTests: 0,
                    testResults: [], executionTime: 0, language, timestamp: Date.now()
                  },
                  ts: Date.now(),
                },
              };
              // send to caller and broadcast
              try { ws.send(JSON.stringify(emptyPayload)); } catch {}
              broadcast(sessionId, emptyPayload, null);
              return;
            }

            // (C) Execute
            // const results = await testExecutionService.executeTestCases(
            //   doc.text,
            const results = await testExecutionService.executeTestCases(
              code,
              language,
              testCases,
              { timeoutMs: 5000, memoryLimit: 128000 }
            );

            // await redisRepo.pushToList(`collab:testLogs:${sessionId}`, {
            //   userId, code: doc.text, language, results, ts: Date.now(),
            await redisRepo.pushToList(`collab:testLogs:${sessionId}`, {
              userId, code, language, results, ts: Date.now(),
            });

            // (D) Return results to everyone AND to caller explicitly
            console.log("[run:testCases] Finished executing tests.");
            console.log("[run:testCases] Summary:", {
              passed: results.passedTests,
              failed: results.failedTests,
              total: results.totalTests,
            });
            const payload = {
              type: "run:testResults",
              testResults: { userId, language, results, ts: Date.now() },
            };
            try { ws.send(JSON.stringify(payload)); } catch {}
            console.log(`[run:testCases] Broadcasting run:testResults for session ${sessionId}`);
            broadcast(sessionId, payload, null);
            return;

          } catch (err) {
            console.error("[WS run:testCases] Error:", err);
            const errorPayload = {
              type: "run:testResults",
              testResults: {
                userId,
                language: msg.language || "javascript",
                results: {
                  totalTests: 0, passedTests: 0, failedTests: 0,
                  testResults: [], executionTime: 0,
                  language: msg.language || "javascript",
                  timestamp: Date.now(),
                  error: err.message
                },
                ts: Date.now(),
              },
            };
            try { ws.send(JSON.stringify(errorPayload)); } catch {}
            broadcast(sessionId, errorPayload, null);
            return;
          }
        }

        // ---- Run Code with Custom Input ----
        if (msg.type === "run:code") {
          try {
            console.log(`[run:code] User ${userId} executed code in session ${sessionId}`);

            const { judge0Provider } = await import("../services/judge0Provider.js");
            
            // Get document content
            let doc = await redisRepo.getJson(`collab:document:${sessionId}`);
            if (!doc) doc = await redisRepo.getJson(`document:${sessionId}`);
            if (!doc) doc = { text: "", version: 0 };
            
            const language = msg.language || "javascript";
            const stdin = msg.stdin || "";
            
            console.log(`[WS run:code] Code: ${doc.text.substring(0, 100)}...`);
            console.log(`[WS run:code] Language: ${language}`);
            console.log(`[WS run:code] Stdin: ${stdin}`);
            
            const result = await judge0Provider.judge0Run({
              code: doc.text,
              language,
              stdin,
              timeoutMs: 5000,
              memoryLimit: 128000
            });
            console.log("[run:code] Execution result:", result);

            console.log(`[WS run:code] Execution result:`, result);

            // Store execution logs
            await redisRepo.pushToList(`collab:executionLogs:${sessionId}`, {
              userId,
              code: doc.text,
              language,
              stdin,
              result,
              ts: Date.now(),
            });

            // Broadcast execution result to all clients in the session
            const payload = {
              type: "run:result",
              run: {
                userId,
                language,
                stdin,
                output: result.stdout,
                error: result.stderr,
                time: result.time,
                memory: result.memory,
                ts: Date.now(),
              },
            };
            console.log(`[WS run:code] Broadcasting result to session ${sessionId}:`, payload);
            broadcast(sessionId, payload, null);
            
          } catch (err) {
            console.error("[WS run:code] Error:", err);
            const errorPayload = {
              type: "run:result",
              run: {
                userId,
                language: msg.language || "javascript",
                stdin: msg.stdin || "",
                output: "",
                error: err.message,
                time: 0,
                memory: 0,
                ts: Date.now(),
              },
            };
            broadcast(sessionId, errorPayload, null);
          }
          return;
        }

        // ---- Custom Input Update ----
        if (msg.type === "customInput:update") {
          try {
            console.log(`[WS customInput:update] Broadcasting custom input update for session ${sessionId}`);
            
            // Broadcast custom input update to all clients in the session
            const payload = {
              type: "customInput:update",
              customInput: msg.customInput,
              userId: userId,
              ts: Date.now(),
            };
            broadcast(sessionId, payload, null);
            
          } catch (err) {
            console.error("[WS customInput:update] Error:", err);
          }
          return;
        }

        // ---- Language Update ----
        if (msg.type === "language:update") {
          try {
            console.log(`[WS language:update] Broadcasting language update for session ${sessionId}, language: ${msg.language}`);
            
            // Store current language in Redis for AI context
            await redisRepo.setJson(`collab:language:${sessionId}`, {
              language: msg.language,
              updatedBy: userId,
              timestamp: Date.now()
            });
            console.log(`[WS Gateway] Stored language ${msg.language} for session ${sessionId}`);
            
            // Broadcast language update to all clients in the session
            const payload = {
              type: "language:update",
              language: msg.language,
              userId: userId,
              ts: Date.now(),
            };
            broadcast(sessionId, payload, null);
            
          } catch (err) {
            console.error("[WS language:update] Error:", err);
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
            console.log(`[WS] AI message received from user ${userId} in session ${sessionId}: ${msg.text?.substring(0, 50)}...`);
            
            // Get current session data for context
            const session = await redisRepo.getJson(`collab:session:${sessionId}`);
            const doc = await redisRepo.getJson(`collab:document:${sessionId}`);
            
            // Get current language from message or Redis storage
            let currentLanguage = msg.language || "python";
            if (!msg.language) {
              const langData = await redisRepo.getJson(`collab:language:${sessionId}`);
              if (langData?.language) {
                currentLanguage = langData.language;
                console.log(`[WS Gateway] Using language from Redis: ${currentLanguage}`);
              }
            }
            
            console.log(`[WS Gateway] AI chat context - language: ${currentLanguage}`);
            
            // Build context
            const context = {
              code: doc?.text || "",
              language: currentLanguage,
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
            console.log(`[WS] Broadcasting AI response to session ${sessionId}`);
            broadcast(sessionId, payload, null);
            return;
          } catch (error) {
            console.error("[WS Gateway] AI message error:", error);
            
            // Send error message to the specific user who requested it
            const errorMsg = {
              userId: "ai-assistant",
              text: `❌ Sorry, I encountered an error: ${error.message}`,
              ts: Date.now(),
              type: "ai"
            };
            
            // Also store in AI chat history
            await redisRepo.pushToList(`collab:ai-chat:${sessionId}`, errorMsg);
            
            // Send error response to the requesting user
            ws.send(JSON.stringify({ 
              type: "ai:message", 
              ...errorMsg
            }));
            return;
          }
        }

        // ---- End Session ----
        if (msg.type === "session:end") {
          console.log(`[WS] ${userId} ended session ${sessionId}`);
          console.log(`[WS] Current room size: ${wsRooms.get(sessionId)?.size || 0}`);
          console.log(`[WS] Room details:`, Array.from(wsRooms.get(sessionId) || []).map(s => ({ readyState: s.readyState })));

          const payload = {
            type: "session:end",
            endedBy: userId,
            message: "Session has been ended by one of the participants.",
          };

          // ✅ Mark session as ended in Redis
          const session = await redisRepo.getJson(`collab:session:${sessionId}`);
          if (session) {
            session.status = "ended";
            await redisRepo.setJson(`collab:session:${sessionId}`, session);
          }

          // ✅ Broadcast to all participants INCLUDING the sender
          console.log(`[WS] Broadcasting session:end to all clients`);
          broadcast(sessionId, payload, ws); // Pass 'ws' to exclude sender from broadcast, then send separately
          ws.send(JSON.stringify(payload)); // Send to the initiating user
          console.log(`[WS] Broadcast complete`);

          // 🕐 Give 1s delay so all clients receive before closing
          setTimeout(() => {
            const room = wsRooms.get(sessionId);
            if (room) {
              for (const sock of room) {
                try {
                  sock.close(1000, "Session ended");
                } catch (err) {
                  console.error("[WS] socket close failed:", err);
                }
              }
              wsRooms.delete(sessionId);
            }
          }, 1000);

          return;
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
  if (!room) {
    console.log(`[WS] No room found for session ${sessionId}`);
    return;
  }

  console.log(`[WS] Broadcasting ${payload.type} to ${room.size} clients in ${sessionId} (excluding: ${exclude ? 'sender' : 'none'})`);
  let sentCount = 0;

  for (const sock of room) {
    try {
      if (sock.readyState === sock.OPEN) {
        if (exclude && sock === exclude) {
          console.log(`[WS] Skipping excluded socket (sender)`);
          continue;
        }
        sock.send(JSON.stringify(payload));
        sentCount++;
        console.log(`[WS] Sent ${payload.type} to client (${sentCount}/${room.size})`);
      } else {
        console.warn("[WS] Skipping closed socket (readyState=" + sock.readyState + ")");
      }
    } catch (err) {
      console.error("[WS] Broadcast failed:", err);
    }
  }
  
  console.log(`[WS] Broadcast complete - sent to ${sentCount} clients`);
}

