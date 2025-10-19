import jwt from 'jsonwebtoken';
const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret';

// Require valid authentication - fails if no token or invalid token
export function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  const token = auth && auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.userId = payload.userId;
    req.roles = payload.roles || [];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.roles || !req.roles.includes('admin')) return res.status(403).json({ message: 'Admin required' });
  next();
}