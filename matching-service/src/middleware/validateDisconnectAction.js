// src/middleware/validateDisconnectAction.js
export function validateDisconnectAction(req, res, next) {
    const { matchId, remainingUserId, action } = req.body;
    const valid = ['solo', 'requeue'];
    const errors = [];
    if (!matchId) errors.push('matchId is required');
    if (!remainingUserId) errors.push('remainingUserId is required');
    if (!valid.includes(action)) errors.push(`action must be one of: ${valid.join(', ')}`);
    if (errors.length) return res.status(400).json({ error: 'Invalid request', details: errors });
    next();
  }