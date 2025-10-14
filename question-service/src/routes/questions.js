// src/routes/questions.js
import express from 'express';
import {
  createQuestion,
  getQuestionById,
  listQuestions,
  getRandomQuestion,
  updateQuestion,
  deleteQuestion,
  getImageSignature
} from '../controllers/questionsController.js';

import { validateCreateQuestion, validateUpdateQuestion } from '../middleware/validateQuestion.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public endpoints - anyone can view questions
router.get('/', listQuestions);
router.get('/random', getRandomQuestion);
router.get('/:id', getQuestionById);

// Admin-only endpoints - require authentication and admin role
// Image signature - admin only (needed before uploading images to Cloudinary)
router.get('/signature', authenticateToken, requireAdmin, getImageSignature);

// Question management - admin only
router.post('/', authenticateToken, requireAdmin, validateCreateQuestion, createQuestion);
router.put('/:id', authenticateToken, requireAdmin, validateUpdateQuestion, updateQuestion);
router.delete('/:id', authenticateToken, requireAdmin, deleteQuestion);


export default router;
