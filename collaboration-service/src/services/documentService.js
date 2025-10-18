import { redisRepo } from "../repos/redisRepo.js";

// export async function getOrCreateDoc(sessionId) {
//   const key = `document:${sessionId}`;
//   const doc = (await redisRepo.getJson(key)) || { version: 0, text: "" };
//   if (!doc.version) await redisRepo.setJson(key, doc);
//   return doc;
// }

export async function getOrCreateDoc(sessionId) {
  const key = `document:${sessionId}`;
  const found = await redisRepo.getJson(key);
  if (found) {
    return {
      text: typeof found.text === "string" ? found.text : "",
      version: Number(found.version ?? 0),
    };
  }
  const fresh = { text: "", version: 0 };
  await redisRepo.setJson(key, fresh);
  return fresh;
}

// export async function applyOp(sessionId, op) {
//   const key = `document:${sessionId}`;
//   const doc = (await redisRepo.getJson(key)) || { version: 0, text: "" };

//   if (op.version !== doc.version) throw new Error("version mismatch");

//   if (op.type === "insert") {
//     if (op.index > doc.text.length) throw new Error("index out of range");
//     doc.text =
//       doc.text.slice(0, op.index) + op.text + doc.text.slice(op.index);
//   } else if (op.type === "delete") {
//     if (op.index + op.length > doc.text.length)
//       throw new Error("delete out of range");
//     doc.text =
//       doc.text.slice(0, op.index) + doc.text.slice(op.index + op.length);
//   } else {
//     throw new Error("unknown op");
//   }

//   doc.version += 1;
//   await redisRepo.setJson(key, doc);
//   return doc;
// }

export function applyOp(doc, op) {
  const docVer = Number(doc?.version ?? 0);
  const opVer  = Number(op?.version);

  if (!Number.isInteger(opVer) || opVer !== docVer) {
    throw new Error("version mismatch");
  }
  if (typeof op?.type !== "string") {
    throw new Error("unknown op");
  }

  // normalize text
  doc.text = typeof doc.text === "string" ? doc.text : "";

  if (op.type === "insert") {
    if (op.index > doc.text.length) throw new Error("index out of range");
    doc.text = doc.text.slice(0, op.index) + op.text + doc.text.slice(op.index);
  } else if (op.type === "delete") {
    // allow length 0 (no-op) but index must be in range [0, text.length]
    if (op.index < 0 || op.index > doc.text.length) {
      throw new Error("delete out of range");
    }
    if (op.index + op.length > doc.text.length) {
      throw new Error("delete out of range");
    }
    if (op.length > 0) {
      doc.text = doc.text.slice(0, op.index) + doc.text.slice(op.index + op.length);
    }
  } else {
    throw new Error("unknown op");
  }

  doc.version = docVer + 1;
  return doc;
}