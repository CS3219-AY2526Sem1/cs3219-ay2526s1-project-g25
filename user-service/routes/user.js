import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getProfile,
  updateProfile,
  deleteAccount
} from '../controllers/userControl.js'

const router = express.Router()

router.get('/me', authenticateToken, getProfile)
router.patch('/me', authenticateToken, updateProfile)
router.delete('/me', authenticateToken, deleteAccount)

export default router