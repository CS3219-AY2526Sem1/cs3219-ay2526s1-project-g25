/**
 * AI Assistance Disclosure:
 * Tool: GitHub Copilot, date: Sept-Oct 2025
 * Scope: Used for difficulty tracking endpoints and generation of documentation
 * Author review: I designed the difficulty feature and data model and reviewed all generated code
 */

import { incrementDifficulty, getDifficultyCounts, resetDifficultyCounts, batchIncrementDifficulties } from '../src/services/difficultyService.js'

/**
 * Controller for managing user difficulty question counts
 */

/**
 * Mark a question as solved and increment the difficulty count
 * POST /api/user/difficulty/solve
 * Body: { difficulty: 'easy' | 'medium' | 'hard' }
 */
export const markQuestionSolved = async (req, res) => {
  try {
    const { difficulty, userId: bodyUserId } = req.body;
    const userId = req.userId || bodyUserId;

    if (!userId)
      return res.status(400).json({ message: "User ID required" });
    if (!difficulty)
      return res.status(400).json({ message: "Difficulty level required" });

    const updatedCounts = await incrementDifficulty(userId, difficulty);

    res.json({
      message: `${difficulty} question solved!`,
      difficulty_counts: updatedCounts,
    });
  } catch (error) {
    console.error("[markQuestionSolved] Error:", error);
    res.status(500).json({
      message: "Failed to update difficulty count",
      error: error.message,
    });
  }
};


/**
 * Get difficulty counts for the authenticated user
 * GET /api/user/difficulty/counts
 */
export const getMyDifficultyCounts = async (req, res) => {
  try {
    const userId = req.userId
    const counts = await getDifficultyCounts(userId)
    
    res.json({
      user_id: userId,
      difficulty_counts: counts
    })
  } catch (error) {
    console.error('[getMyDifficultyCounts] Error:', error)
    res.status(500).json({ 
      message: 'Failed to get difficulty counts',
      error: error.message 
    })
  }
}

/**
 * Reset difficulty counts for the authenticated user
 * DELETE /api/user/difficulty/counts
 */
export const resetMyDifficultyCounts = async (req, res) => {
  try {
    const userId = req.userId
    await resetDifficultyCounts(userId)
    
    res.json({
      message: 'Difficulty counts reset successfully',
      difficulty_counts: { easy: 0, medium: 0, hard: 0 }
    })
  } catch (error) {
    console.error('[resetMyDifficultyCounts] Error:', error)
    res.status(500).json({ 
      message: 'Failed to reset difficulty counts',
      error: error.message 
    })
  }
}

/**
 * Batch update difficulty counts (for importing solve history)
 * PUT /api/user/difficulty/batch
 * Body: { increments: { easy: 5, medium: 2, hard: 1 } }
 */
export const batchUpdateDifficultyCounts = async (req, res) => {
  try {
    const { increments } = req.body
    const userId = req.userId

    if (!increments || typeof increments !== 'object') {
      return res.status(400).json({ message: 'Increments object is required' })
    }

    const updatedCounts = await batchIncrementDifficulties(userId, increments)
    
    res.json({
      message: 'Difficulty counts updated successfully',
      difficulty_counts: updatedCounts
    })
  } catch (error) {
    console.error('[batchUpdateDifficultyCounts] Error:', error)
    res.status(500).json({ 
      message: 'Failed to batch update difficulty counts',
      error: error.message 
    })
  }
}