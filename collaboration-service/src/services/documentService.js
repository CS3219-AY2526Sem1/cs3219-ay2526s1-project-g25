import { redisRepo } from "../repos/redisRepo.js";

export async function getOrCreateDoc(sessionId) {
  const key = `document:${sessionId}`;
  const doc = (await redisRepo.getJson(key)) || { version: 0, text: "" };
  if (!doc.version) await redisRepo.setJson(key, doc);
  return doc;
}

export async function applyOp(sessionId, op) {
  const key = `document:${sessionId}`;
  const doc = (await redisRepo.getJson(key)) || { version: 0, text: "" };

  if (op.version !== doc.version) throw new Error("version mismatch");

  if (op.type === "insert") {
    if (op.index > doc.text.length) throw new Error("index out of range");
    doc.text =
      doc.text.slice(0, op.index) + op.text + doc.text.slice(op.index);
  } else if (op.type === "delete") {
    if (op.index + op.length > doc.text.length)
      throw new Error("delete out of range");
    doc.text =
      doc.text.slice(0, op.index) + doc.text.slice(op.index + op.length);
  } else {
    throw new Error("unknown op");
  }

  doc.version += 1;
  await redisRepo.setJson(key, doc);
  return doc;
}
