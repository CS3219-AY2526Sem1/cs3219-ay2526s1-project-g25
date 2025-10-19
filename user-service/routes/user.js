import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getUserByUsername,
  updateProfileByUsername,
  deleteAccountByUsername
} from '../controllers/userControl.js'

const router = express.Router()

// Username-based routes - All require authentication
router.get('/:username', requireAuth, getUserByUsername)           // Requires authentication to view any profile
router.patch('/:username', requireAuth, updateProfileByUsername)   // Requires authentication to edit
router.delete('/:username', requireAuth, deleteAccountByUsername)  // Requires authentication to delete

export default router