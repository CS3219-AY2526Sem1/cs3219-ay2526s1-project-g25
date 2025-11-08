import express from 'express'
import { body } from 'express-validator'
import path from 'path'
import { fileURLToPath } from 'url'
import { deleteAccountByUsername } from '../controllers/userControl.js'
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  requestPasswordReset,
  resendVerification,
  confirmPasswordReset
} from '../controllers/authController.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Register a new user
router.post(
  '/register',
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isString(),
  body('confirmPassword').isString(),
  register
)

// Handle Supabase verification redirect (when user clicks email link)
router.get('/verify', verifyEmail)

// Login user
router.post(
  '/login',
  body('identifier').isString(),
  body('password').isString(),
  login
)

// Refresh JWT tokens
router.post('/refresh', refreshToken)

// Logout user
router.post('/logout', logout)

// Request password reset email
router.post('/password-reset', body('email').isEmail(), requestPasswordReset)

// Resend verification email
router.post('/resend-verification', body('email').isEmail(), resendVerification)

// Serve password reset page
router.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'reset-password.html'))
})

// Confirm password reset
router.post(
  '/password-reset/confirm',
  body('accessToken').isString(),
  body('newPassword').isString(),
  body('confirmNewPassword').isString(),
  confirmPasswordReset
)

// Delete own account (authenticated user)
router.post('/delete-account', deleteAccountByUsername)

export default router