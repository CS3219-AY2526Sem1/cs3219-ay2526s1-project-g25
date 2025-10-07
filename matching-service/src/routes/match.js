import express from 'express';
import { validateJoin, validateLeave } from '../middleware/validateMatchRequest.js';
import { validateDisconnectAction } from '../middleware/validateDisconnectAction.js';
import { joinQueue, leaveQueue, getStatus, handleDisconnect } from '../controllers/matchController.js';
import { authenticateUser } from '../middleware/authProxy.js';

const router = express.Router();

// POST /match/join  { userId, topics:[...], difficulty:'easy|medium|hard' }
router.post('/join', validateJoin, joinQueue);

// POST /match/leave { userId }
router.post('/leave', validateLeave, leaveQueue);

// GET /match/status/:userId
router.get('/status/:userId', getStatus);

// POST /match/disconnect { matchId, remainingUserId, action:'solo'|'requeue' }
router.post('/disconnect', validateDisconnectAction, handleDisconnect);

export default router;