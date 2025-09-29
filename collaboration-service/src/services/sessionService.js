import { randomUUID } from 'crypto';
export function createSession(data){ return { id: randomUUID(), startedAt: Date.now(), status: 'active', ...data }; }
