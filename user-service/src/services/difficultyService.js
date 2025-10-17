import { supabase } from './supabaseClient.js'

/**
 * Service for managing user difficulty question counts
 * Uses atomic database operations to avoid race conditions
 */

/**
 * Increment the count of solved questions for a specific difficulty level
 * @param {string} userId - UUID of the user
 * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard')
 * @param {number} delta - Amount to increment (default: 1)
 * @returns {Promise<Object>} Updated difficulty counts
 */
export const incrementDifficulty = async (userId, difficulty, delta = 1) => {
  const validDifficulties = ['easy', 'medium', 'hard']
  
  if (!validDifficulties.includes(difficulty)) {
    throw new Error(`Invalid difficulty level: ${difficulty}. Must be one of: ${validDifficulties.join(', ')}`)
  }

  // Get current counts
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('difficulty_counts')
    .eq('id', userId)
    .single()

  if (fetchError) {
    console.error('[incrementDifficulty] Fetch error:', fetchError)
    throw new Error(`Failed to fetch user data: ${fetchError.message}`)
  }

  // Calculate new counts
  const currentCounts = users.difficulty_counts || { easy: 0, medium: 0, hard: 0 }
  const newCounts = {
    ...currentCounts,
    [difficulty]: (currentCounts[difficulty] || 0) + delta
  }

  // Update in database
  const { data, error } = await supabase
    .from('users')
    .update({ difficulty_counts: newCounts })
    .eq('id', userId)
    .select('difficulty_counts')
    .single()

  if (error) {
    console.error('[incrementDifficulty] Update error:', error)
    throw new Error(`Failed to increment difficulty count: ${error.message}`)
  }

  return data.difficulty_counts
}

/**
 * Get difficulty counts for a specific user
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object>} Difficulty counts object
 */
export const getDifficultyCounts = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('difficulty_counts')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[getDifficultyCounts] Error:', error)
    throw new Error(`Failed to get difficulty counts: ${error.message}`)
  }

  // Ensure all difficulty levels have a value
  const defaultCounts = { easy: 0, medium: 0, hard: 0 }
  return { ...defaultCounts, ...data.difficulty_counts }
}

/**
 * Reset all difficulty counts for a user (useful for testing or admin actions)
 * @param {string} userId - UUID of the user
 * @returns {Promise<boolean>} Success status
 */
export const resetDifficultyCounts = async (userId) => {
  const { error } = await supabase
    .from('users')
    .update({ difficulty_counts: { easy: 0, medium: 0, hard: 0 } })
    .eq('id', userId)

  if (error) {
    console.error('[resetDifficultyCounts] Error:', error)
    throw new Error(`Failed to reset difficulty counts: ${error.message}`)
  }

  return true
}

/**
 * Batch increment multiple difficulties (e.g., when importing solve history)
 * @param {string} userId - UUID of the user
 * @param {Object} increments - Object with difficulty keys and increment values
 * @returns {Promise<Object>} Updated difficulty counts
 */
export const batchIncrementDifficulties = async (userId, increments) => {
  let currentCounts = await getDifficultyCounts(userId)

  // Apply all increments
  for (const [difficulty, delta] of Object.entries(increments)) {
    if (delta > 0) {
      currentCounts = await incrementDifficulty(userId, difficulty, delta)
    }
  }

  return currentCounts
}