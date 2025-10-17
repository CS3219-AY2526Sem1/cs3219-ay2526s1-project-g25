import jwt from 'jsonwebtoken';

/**
 * Shared JWT utilities for question service
 * This maintains consistency with the user-service authentication
 */

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret';

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {object} - Decoded token payload
 * @throws {Error} - If token format is invalid
 */
export const decodeJWT = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

/**
 * Check if user has admin role
 * @param {Array<string>} roles - Array of user roles
 * @returns {boolean} - True if user has admin role
 */
export const isAdmin = (roles) => {
  return roles && Array.isArray(roles) && roles.includes('admin');
};

/**
 * Check if user has a specific role
 * @param {Array<string>} roles - Array of user roles
 * @param {string} requiredRole - Required role to check
 * @returns {boolean} - True if user has the required role
 */
export const hasRole = (roles, requiredRole) => {
  return roles && Array.isArray(roles) && roles.includes(requiredRole);
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string} - Extracted token
 * @throws {Error} - If authorization header is missing or invalid
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  return authHeader.substring(7);
};

