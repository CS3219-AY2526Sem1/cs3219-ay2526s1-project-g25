import express from 'express'
import { verifyToken, verifyAdminToken } from '../controllers/tokenController.js'

const router = express.Router()

// POST /api/token/verify - Verify token and return user info
router.post('/verify', verifyToken)

// POST /api/token/verify-admin - Check if token belongs to an admin
router.post('/verify-admin', verifyAdminToken)

export default router