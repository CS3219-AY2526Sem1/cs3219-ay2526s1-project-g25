"use client";
import * as Y from "yjs";

export function attachYDocToWs(wsUrl: string, doc: Y.Doc) {
  const token = (typeof window !== 'undefined') ? sessionStorage.getItem('collabToken') : null;
  const url = new URL(wsUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  if (token && !url.searchParams.get('t')) url.searchParams.set('t', token);

  const ws = new WebSocket(url.toString());
  ws.binaryType = "arraybuffer";

  const onWsMessage = (evt: MessageEvent) => {
    // Handle string messages (e.g., session:end)
    if (typeof evt.data === "string") {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "session:end") {
          console.log("[YJS Client] Received session:end, dispatching event");
          window.dispatchEvent(new CustomEvent('session-end', { detail: msg }));
        }
      } catch (e) {
        // Not JSON or not session:end, ignore
      }
      return;
    }
    const update = new Uint8Array(evt.data as ArrayBuffer);
    try { Y.applyUpdate(doc, update); } catch {}
  };
  ws.addEventListener("message", onWsMessage);

  const onDocUpdate = (update: Uint8Array) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(update);
  };
  doc.on("update", onDocUpdate);

  const teardown = () => {
    try { doc.off("update", onDocUpdate); } catch {}
    try { ws.removeEventListener("message", onWsMessage); } catch {}
    try { ws.close(); } catch {}
  };
  ws.addEventListener("close", teardown);
  ws.addEventListener("error", () => teardown());

  return { ws, teardown };
}
