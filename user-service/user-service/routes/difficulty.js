/**
 * AI Assistance Disclosure:
 * Tool: GitHub Copilot, date: Sept-Oct 2025
 * Scope: Used for route definitions and API documentation
 * Author review: I designed the difficulty tracking API and reviewed all generated code
 */

import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { 
  markQuestionSolved, 
  getMyDifficultyCounts, 
  resetMyDifficultyCounts, 
  batchUpdateDifficultyCounts 
} from '../controllers/difficultyController.js'

const router = express.Router()

/**
 * @route   POST /api/difficulty/solve
 * @desc    Mark a question as solved and increment difficulty count
 * @access  Private
 * @body    { difficulty: 'easy' | 'medium' | 'hard' }
 */
router.post('/solve', markQuestionSolved)

/**
 * @route   GET /api/difficulty/counts
 * @desc    Get difficulty counts for authenticated user
 * @access  Private
 */
router.get('/counts', getMyDifficultyCounts)

/**
 * @route   DELETE /api/difficulty/counts
 * @desc    Reset difficulty counts for authenticated user
 * @access  Private
 */
router.delete('/counts', resetMyDifficultyCounts)

/**
 * @route   PUT /api/difficulty/batch
 * @desc    Batch update difficulty counts
 * @access  Private
 * @body    { increments: { easy: 5, medium: 2, hard: 1 } }
 */
router.put('/batch', batchUpdateDifficultyCounts)

export default router