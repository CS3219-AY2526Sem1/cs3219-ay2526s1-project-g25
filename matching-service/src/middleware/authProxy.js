// src/middleware/authProxy.js
import axios from "axios";

const USER_SERVICE_BASE_URL = process.env.USER_SERVICE_BASE_URL || "http://localhost:3001";

/**
 * Middleware to authenticate user using token from User Service
 */
export async function authenticateUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token)
    return res.status(401).json({ message: "Missing token" });

  try {
    // Make sure endpoint matches your user-service route
    const { data } = await axios.post(
      `${USER_SERVICE_BASE_URL}/api/token/verify`,
      { token }
    );

    if (!data.valid)
      return res.status(401).json({ message: "Invalid token" });

    req.user = data.user; // attach verified user details
    next();
  } catch (err) {
    console.error("Auth check failed:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/**
 * Optional middleware for admin-only endpoints
 */
export async function requireAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token)
    return res.status(401).json({ message: "Missing token" });

  try {
    // Matches the verify-admin endpoint in user-service
    const { data } = await axios.post(
      `${USER_SERVICE_BASE_URL}/api/token/verify-admin`,
      { token }
    );

    if (!data.valid || !data.isAdmin)
      return res.status(403).json({ message: "Admin access required" });

    req.user = { id: data.userId };
    next();
  } catch (err) {
    console.error("Admin check failed:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
}
