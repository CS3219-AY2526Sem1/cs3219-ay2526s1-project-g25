// Fixed version of question-service/src/routes/questions.js
// Copy this entire file to: question-service/src/routes/questions.js

import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getCloudinarySignature
} from '../controllers/questionsController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllQuestions);

// ✅ IMPORTANT: Specific routes MUST come BEFORE parameterized routes
// This MUST be before /:id route, otherwise "signature" is treated as an ID
router.get('/signature', authenticateToken, requireAdmin, getCloudinarySignature);

// Parameterized routes (AFTER specific routes)
router.get('/:id', getQuestionById);

// Admin-only routes (protected)
router.post('/', authenticateToken, requireAdmin, createQuestion);
router.put('/:id', authenticateToken, requireAdmin, updateQuestion);
router.delete('/:id', authenticateToken, requireAdmin, deleteQuestion);

export default router;

