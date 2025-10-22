
import { Router } from 'express';
import { createSession, getSession, joinSession, leaveSession, execute } from '../controllers/sessionController.js';
import { 
  chatWithAI, 
  analyzeSessionCode, 
  getHintForSession, 
  debugSessionError,
  explainProgrammingConcept,
  getAIChatHistory
} from '../controllers/aiController.js';

const r = Router();

// Session routes
r.post('/sessions', createSession);
r.get('/sessions/:id', getSession);
r.post('/sessions/:id/join', joinSession);
r.post('/sessions/:id/leave', leaveSession);
r.post('/sessions/:id/execute', execute);

// AI routes
r.post('/sessions/:id/ai/chat', chatWithAI);
r.post('/sessions/:id/ai/analyze', analyzeSessionCode);
r.post('/sessions/:id/ai/hint', getHintForSession);
r.post('/sessions/:id/ai/debug', debugSessionError);
r.get('/sessions/:id/ai/history', getAIChatHistory);
r.post('/ai/explain', explainProgrammingConcept);

export default r;
