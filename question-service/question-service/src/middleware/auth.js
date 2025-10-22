import { verifyJWT, isAdmin, extractTokenFromHeader } from '../lib/jwtUtils.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);
    
    // Verify token and extract payload
    const payload = verifyJWT(token);
    
    // Attach user info to request
    req.userId = payload.userId;
    req.roles = payload.roles || [];
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Unauthorized', 
      error: error.message 
    });
  }
}

/**
 * Admin authorization middleware
 * Requires authenticateToken to be called first
 * Checks if user has admin role
 */
export function requireAdmin(req, res, next) {
  if (!req.roles || !isAdmin(req.roles)) {
    return res.status(403).json({ 
      message: 'Forbidden: Admin access required' 
    });
  }
  next();
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't reject if missing
 * Useful for endpoints that behave differently for authenticated vs unauthenticated users
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      const payload = verifyJWT(token);
      req.userId = payload.userId;
      req.roles = payload.roles || [];
    }
  } catch (error) {
    // Silently fail for optional auth
    // Request continues without user info
  }
  next();
}

