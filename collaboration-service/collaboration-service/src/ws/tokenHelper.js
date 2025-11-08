import jwt from "jsonwebtoken";

function verifyCollabTokenOrThrow(token, expectedSessionId) {
  const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_TOKEN_SECRET not configured");

  const decoded = jwt.verify(token, secret); // will throw if invalid/expired

  // Optional hardening: assert audience and session binding if present
  if (decoded.aud && decoded.aud !== "collab") {
    throw new Error("invalid audience");
  }
  if (decoded.sessionId && expectedSessionId && decoded.sessionId !== expectedSessionId) {
    throw new Error("session mismatch");
  }
  return decoded;
}

export { verifyCollabTokenOrThrow };