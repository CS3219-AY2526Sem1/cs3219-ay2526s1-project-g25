import { validationResult } from 'express-validator'
import { supabase } from '../src/services/supabaseClient.js'
import { generateSalt, hashPassword, verifyPassword } from '../src/utils/hash.js'
import jwt from 'jsonwebtoken'
import { sendMail } from '../src/config/mailer.js'

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret'
const REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'dev_refresh_secret'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

function passwordStrong(pw) {
  return pw.length >= 12 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
}

export const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { username, email, password, confirmPassword } = req.body
  if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' })
  if (!passwordStrong(password)) return res.status(400).json({ message: 'Password too weak' })

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .or(`username.eq.${username},email.eq.${email}`)

  if (existing && existing.length > 0) {
    return res.status(409).json({ message: 'Username or email already taken' })
  }

  const salt = generateSalt()
  const passwordHash = hashPassword(password, salt)

  const { error: insertError, data: newUser } = await supabase
    .from('users')
    .insert([{ username, email, password_hash: passwordHash, salt, is_active: false }])
    .select()

  if (insertError) return res.status(500).json({ message: 'Error creating user', error: insertError })

  const token = jwt.sign({ userId: newUser[0].id, type: 'verify' }, ACCESS_SECRET, { expiresIn: '24h' })
  const link = `${BASE_URL}/auth/verify?token=${token}`

  await sendMail({ to: email, subject: 'Verify your PeerPrep account', html: `<a href="${link}">${link}</a>` })

  res.status(201).json({ message: 'Registered. Check your email to verify.' })
}

export const verifyEmail = async (req, res) => {
  const { token } = req.query
  if (!token) return res.status(400).json({ message: 'Missing token' })

  try {
    const payload = jwt.verify(token, ACCESS_SECRET)
    if (payload.type !== 'verify') return res.status(400).json({ message: 'Invalid token' })

    await supabase.from('users').update({ is_active: true }).eq('id', payload.userId)
    res.json({ message: 'Account verified. You can now login.' })
  } catch {
    res.status(400).json({ message: 'Invalid or expired token' })
  }
}

function makeAccessToken(userId, roles) {
  return jwt.sign({ userId, roles }, ACCESS_SECRET, { expiresIn: '15m' })
}
function makeRefreshToken(userId) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' })
}

export const login = async (req, res) => {
  const { identifier, password } = req.body

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${identifier},username.eq.${identifier}`)
    .limit(1)

  const user = users && users[0]
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  if (!user.is_active) return res.status(403).json({ message: 'Account not activated' })
  if (!verifyPassword(password, user.salt, user.password_hash)) return res.status(401).json({ message: 'Invalid credentials' })

  const accessToken = makeAccessToken(user.id, user.roles)
  const refreshToken = makeRefreshToken(user.id)

  await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id)

  res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username, email: user.email } })
}

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' })

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET)

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .eq('refresh_token', refreshToken)
      .limit(1)

    if (!users || users.length === 0) return res.status(401).json({ message: 'Invalid refresh token' })

    const newAccess = makeAccessToken(payload.userId, users[0].roles)
    res.json({ accessToken: newAccess })
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

export const logout = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' })

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET)
    await supabase.from('users').update({ refresh_token: null }).eq('id', payload.userId)
    res.json({ message: 'Logged out' })
  } catch {
    res.json({ message: 'Logged out' }) // idempotent
  }
}

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body

  const { data: users } = await supabase.from('users').select('*').eq('email', email).limit(1)
  const user = users && users[0]

  if (user) {
    const token = jwt.sign({ userId: user.id, type: 'reset' }, ACCESS_SECRET, { expiresIn: '15m' })
    const link = `${FRONTEND_URL}/auth/password-reset?token=${token}`
    await sendMail({ to: email, subject: 'Password Reset', html: `<a href="${link}">${link}</a>` })
  }

  res.json({ message: 'If the email exists, a reset link was sent.' })
}

export const confirmPasswordReset = async (req, res) => {
  const { token, newPassword } = req.body
  if (!passwordStrong(newPassword)) return res.status(400).json({ message: 'Password too weak' })

  try {
    const payload = jwt.verify(token, ACCESS_SECRET)
    if (payload.type !== 'reset') return res.status(400).json({ message: 'Invalid token' })

    const salt = generateSalt()
    const hash = hashPassword(newPassword, salt)

    await supabase.from('users').update({ salt, password_hash: hash, refresh_token: null }).eq('id', payload.userId)
    res.json({ message: 'Password reset successful' })
  } catch {
    res.status(400).json({ message: 'Invalid or expired token' })
  }
}