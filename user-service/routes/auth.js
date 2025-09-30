import express from 'express'
import { body } from 'express-validator'
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  requestPasswordReset,
  confirmPasswordReset
} from '../controllers/authController.js'

const router = express.Router()

router.post('/register',
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isString(),
  body('confirmPassword').isString(),
  register
)

router.get('/verify', verifyEmail)
router.post('/login', body('identifier').isString(), body('password').isString(), login)
router.post('/refresh', refreshToken)
router.post('/logout', logout)
router.post('/password-reset', body('email').isEmail(), requestPasswordReset)
router.post('/password-reset/confirm', body('token').isString(), body('newPassword').isString(), confirmPasswordReset)

export default router