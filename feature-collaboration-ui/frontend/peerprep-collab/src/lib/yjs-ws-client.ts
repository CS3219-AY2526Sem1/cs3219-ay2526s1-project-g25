"use client";
import * as Y from "yjs";

export function attachYDocToWs(wsUrl: string, doc: Y.Doc) {
  // 🔒 Step 1: Get token from sessionStorage
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("collabToken") : null;

  // 🛑 If no token, don’t even try to connect
  if (!token) {
    console.warn("[YJS Client] No collabToken found in sessionStorage — aborting Yjs connect.");
    return { ws: null, teardown: () => {} };
  }

  // 🌐 Step 2: Construct full WebSocket URL (append ?t=<token>)
  const url = new URL(
    wsUrl,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );

  // Only append token if not already present
  if (!url.searchParams.get("t")) url.searchParams.set("t", token);

  console.log("[YJS Client] Connecting to:", url.toString().replace(token, "<redacted>"));

  // 🧩 Step 3: Create WebSocket connection
  const ws = new WebSocket(url.toString());
  ws.binaryType = "arraybuffer";

  // 📨 Step 4: Handle incoming messages
  const onWsMessage = (evt: MessageEvent) => {
    if (typeof evt.data === "string") {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "session:end") {
          console.log("[YJS Client] Received session:end, dispatching event");
          window.dispatchEvent(new CustomEvent("session-end", { detail: msg }));
        }
      } catch {
        // Ignore malformed or irrelevant messages
      }
      return;
    }

    const update = new Uint8Array(evt.data as ArrayBuffer);
    try {
      Y.applyUpdate(doc, update);
    } catch (err) {
      console.error("[YJS Client] Failed to apply Yjs update:", err);
    }
  };

  ws.addEventListener("message", onWsMessage);

  // 🔁 Step 5: Send doc updates to the WS
  const onDocUpdate = (update: Uint8Array) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(update);
    }
  };
  doc.on("update", onDocUpdate);

  // 🧹 Step 6: Clean up when closed
  const teardown = () => {
    try {
      doc.off("update", onDocUpdate);
      ws.removeEventListener("message", onWsMessage);
      ws.close();
      console.log("[YJS Client] Closed Yjs socket cleanly.");
    } catch (e) {
      console.warn("[YJS Client] Error during teardown:", e);
    }
  };

  ws.addEventListener("close", teardown);
  ws.addEventListener("error", teardown);

  return { ws, teardown };
}
