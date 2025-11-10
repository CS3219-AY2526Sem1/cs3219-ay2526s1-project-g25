// src/middleware/auth.js
import jwt from "jsonwebtoken";
import { redisRepo } from "../repos/redisRepo.js";

const JWT_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || "dev_access_secret";

/**
 * Middleware to authenticate user using JWT token
 * Extracts token from Authorization header and verifies it
 * Attaches user info to req.user
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: String(payload.userId), // Ensure userId is string
      roles: payload.roles || [],
    };
    next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware to verify user is a participant in the session
 * Must be used after authenticateToken
 */
export async function verifySessionParticipant(req, res, next) {
  try {
    const sessionId = req.params.id;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if user is a participant in the session
    const isParticipant = await redisRepo.sIsMember(
      `collab:session:${sessionId}:participants`,
      userId
    );

    if (!isParticipant) {
      console.log(
        `[Auth] User ${userId} is not a participant in session ${sessionId}`
      );
      return res.status(403).json({ error: "Access denied to this session" });
    }

    next();
  } catch (error) {
    console.error("[Auth] Session participant verification failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

