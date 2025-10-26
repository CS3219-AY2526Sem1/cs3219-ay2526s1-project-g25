"use client";
import * as Y from "yjs";

export function attachYDocToWs(wsUrl: string, doc: Y.Doc) {
  const ws = new WebSocket(wsUrl);
  ws.binaryType = "arraybuffer";

  const onWsMessage = (evt: MessageEvent) => {
    if (typeof evt.data === "string") return;
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
