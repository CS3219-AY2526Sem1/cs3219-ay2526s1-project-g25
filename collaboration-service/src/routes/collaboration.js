
import { Router } from 'express';
import { createSession, getSession, joinSession, leaveSession, execute } from '../controllers/sessionController.js';

const r = Router();

r.post('/sessions', createSession);
r.get('/sessions/:id', getSession);
r.post('/sessions/:id/join', joinSession);
r.post('/sessions/:id/leave', leaveSession);
r.post('/sessions/:id/execute', execute);

export default r;
