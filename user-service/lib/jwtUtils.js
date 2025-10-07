import jwt from 'jsonwebtoken'

/**
 * Shared JWT utilities for microservices
 * Use this in all services to maintain consistency
 */

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret'

export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET)
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const decodeJWT = (token) => {
  try {
    return jwt.decode(token)
  } catch (error) {
    throw new Error('Invalid token format')
  }
}

export const isAdmin = (roles) => {
  return roles && Array.isArray(roles) && roles.includes('admin')
}

export const hasRole = (roles, requiredRole) => {
  return roles && Array.isArray(roles) && roles.includes(requiredRole)
}

export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }
  return authHeader.substring(7)
}

// Middleware factory for other services
export const createAuthMiddleware = (userServiceUrl) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      const token = extractTokenFromHeader(authHeader)
      
      // Verify token locally first (faster)
      const payload = verifyJWT(token)
      
      // For critical operations, you might want to verify with user service
      // const response = await fetch(`${userServiceUrl}/api/token/verify`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token })
      // })
      // const userData = await response.json()
      
      req.user = {
        id: payload.userId,
        roles: payload.roles || []
      }
      
      next()
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' })
    }
  }
}

export const createAdminMiddleware = (userServiceUrl) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      const token = extractTokenFromHeader(authHeader)
      
      const payload = verifyJWT(token)
      
      if (!isAdmin(payload.roles)) {
        return res.status(403).json({ message: 'Admin access required' })
      }
      
      req.user = {
        id: payload.userId,
        roles: payload.roles || []
      }
      
      next()
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' })
    }
  }
}