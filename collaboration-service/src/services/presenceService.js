export function touchPresence(p, userId, cursor) { p.set(userId, { cursor, lastSeen: Date.now() }); }
