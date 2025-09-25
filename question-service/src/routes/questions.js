// src/routes/questions.js
import express from 'express';
import {
  createQuestion,
  getQuestionById,
  listQuestions,
  getRandomQuestion,
  updateQuestion,
  deleteQuestion
} from '../controllers/questionsController.js';

import { validateCreateQuestion, validateUpdateQuestion } from '../middleware/validateQuestion.js';

const router = express.Router();

// All endpoints assumed to be protected by auth in production.
// For now, we expose them; add auth middleware (authenticate, requireAdmin) as you integrate auth.
router.post('/', validateCreateQuestion, createQuestion);
router.get('/', listQuestions);
router.get('/random', getRandomQuestion);
router.get('/:id', getQuestionById);


export default router;
