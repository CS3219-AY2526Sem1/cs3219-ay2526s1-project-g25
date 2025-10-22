import { validationResult } from 'express-validator'
import { supabase } from '../src/services/supabaseClient.js'
import { generateSalt, hashPassword, verifyPassword } from '../src/utils/hash.js'
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret'
const REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'dev_refresh_secret'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// ---------------- Password Policy ----------------
function passwordStrong(pw) {
  return pw.length >= 12 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
}

// ---------------- Registration ----------------
export const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { username, email, password, confirmPassword } = req.body
  if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' })
  if (!passwordStrong(password)) return res.status(400).json({ message: 'Password too weak' })

  // Duplicate check
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .or(`username.eq.${username},email.eq.${email}`)

  if (existing && existing.length > 0) {
    return res.status(409).json({ message: 'Username or email already taken' })
  }

  // Hash + store inactive user
  const salt = generateSalt()
  const passwordHash = hashPassword(password, salt)

  const { data: userData, error: insertError } = await supabase
    .from('users')
    .insert([{ 
      username, 
      email, 
      password_hash: passwordHash, 
      salt, 
      is_active: false,
      difficulty_counts: { easy: 0, medium: 0, hard: 0 }
    }])
    .select()
    .single()

  if (insertError) return res.status(500).json({ message: 'Error creating user', error: insertError })

  // Always create our own verification token
  const verificationToken = jwt.sign({ userId: userData.id, type: 'verify' }, ACCESS_SECRET, { expiresIn: '30m' })
  const verificationUrl = `${FRONTEND_URL}/auth/verify?token=${verificationToken}`
  
  // Skip email sending in test environment
  if (process.env.NODE_ENV !== 'test') {
    // Use Supabase auth to send email, but we'll handle verification with our token
    // First, create the Supabase auth user (this triggers their email)
    const { data: authData, error: mailError } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        // Redirect to our verification endpoint with our token
        emailRedirectTo: verificationUrl,
        data: {
          username: username,
          verification_token: verificationToken
        }
      }
    })

    // Store the Supabase Auth ID in our users table if auth user was created
    if (authData?.user?.id) {
      await supabase
        .from('users')
        .update({ supabase_auth_id: authData.user.id })
        .eq('id', userData.id)
    }

    if (mailError) {
      console.error('[register] Supabase mail error:', mailError)
      // If Supabase email fails, fall back to logging the verification info
      console.log(`Manual verification needed for ${email}:`)
      console.log(`Verification URL: ${verificationUrl}`)
    } else {
      console.log(`Verification email sent to ${email} via Supabase`)
    }
  }

  res.status(201).json({ 
    message: 'Registered successfully. Check your email to verify your account.',
    ...(process.env.NODE_ENV === 'test' && { verificationToken })
  })
}

// ---------------- Email Verification ----------------
export const verifyEmail = async (req, res) => {
  // Accept token from query parameters OR request body
  const token = req.query.token || req.body.token

  if (!token) {
    return res.status(400).json({ message: 'Missing token' })
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET)
    
    if (payload.type !== 'verify') {
      return res.status(400).json({ message: 'Invalid token' })
    }

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .limit(1)

    const user = users?.[0]
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    if (user.is_active) {
      return res.status(200).json({ message: 'Email already verified' })
    }

    // Generate refresh token for newly activated user
    const refreshToken = makeRefreshToken(user.id)
    
    await supabase.from('users').update({ 
      is_active: true,
      refresh_token: refreshToken 
    }).eq('id', payload.userId)

    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('[verifyEmail] Error:', error.message)
    res.status(400).json({ message: 'Invalid or expired token' })
  }
}

// ---------------- Auth Token Helpers ----------------
function makeAccessToken(userId, roles) {
  return jwt.sign({ userId, roles }, ACCESS_SECRET, { expiresIn: '15m' })
}

function makeRefreshToken(userId) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' })
}

// ---------------- Login ----------------
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
  if (!verifyPassword(password, user.salt, user.password_hash))
    return res.status(401).json({ message: 'Invalid credentials' })

  const accessToken = makeAccessToken(user.id, user.roles)
  const refreshToken = makeRefreshToken(user.id)
  await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id)

  res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username, email: user.email, roles: user.roles } })
}

// ---------------- Token Refresh ----------------
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ message: 'Missing refresh token' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .eq('refresh_token', refreshToken)
      .limit(1);

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccess = makeAccessToken(payload.userId, users[0].roles);
    res.json({ accessToken: newAccess });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

// ---------------- Logout ----------------
export const logout = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' })

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET)
    await supabase.from('users').update({ refresh_token: null }).eq('id', payload.userId)
    res.json({ message: 'Logged out' })
  } catch {
    res.json({ message: 'Logged out' }) // idempotent - always return success for security
  }
}

// ---------------- Password Reset ----------------
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email is required' })
  }

  try {
    // Use Supabase's built-in password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${FRONTEND_URL}/auth/reset-password`
    })

    // Always log what happened for debugging, but don't reveal to user
    if (error) {
      console.error('[requestPasswordReset] Supabase error:', error)
    } else {
      console.log(`Password reset email sent to ${email} via Supabase`)
    }
    
    // Always return the same message for security (don't reveal if email exists or if there were errors)
    res.json({ message: 'If the email exists and is verified, a password reset link was sent.' })

  } catch (error) {
    console.error('[requestPasswordReset] Unexpected error:', error)
    // Still return the same message to not reveal system details
    res.json({ message: 'If the email exists and is verified, a password reset link was sent.' })
  }
}

export const confirmPasswordReset = async (req, res) => {
  const { accessToken, newPassword, confirmNewPassword } = req.body

  if (!accessToken) {
    return res.status(400).json({ message: 'Access token is required' })
  }

  if (!newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'Missing password fields' })
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'Passwords do not match' })
  }

  if (!passwordStrong(newPassword)) {
    return res.status(400).json({ message: 'Password too weak' })
  }

  try {
    // Use fetch to directly call Supabase's REST API for password update
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': process.env.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        password: newPassword
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[confirmPasswordReset] Supabase API error:', result)

      // Map Supabase errors to user-friendly messages
      const msg = (result && (result.msg || result.message || '')) || ''
      const code = (result && (result.error_code || result.code)) || ''
      const normalized = `${code}`.toLowerCase() + ' ' + `${msg}`.toLowerCase()

      let friendly = 'We could not update your password.'
      // Specific known cases
      if (normalized.includes('same_password') || normalized.includes('same password')) {
        friendly = 'New password must be different from your current password.'
      } else if (normalized.includes('weak_password') || normalized.includes('weak password')) {
        friendly = 'Password does not meet the strength requirements.'
      } else if (
        normalized.includes('bad_jwt') ||
        normalized.includes('jwt expired') ||
        normalized.includes('expired') ||
        normalized.includes('invalid jwt') ||
        normalized.includes('unable to parse') ||
        normalized.includes('malformed')
      ) {
        friendly = 'The reset link is invalid or has expired. Please request a new link.'
      } else if (normalized.includes('rate limit') || normalized.includes('too many requests') || normalized.includes('429')) {
        friendly = 'Too many attempts. Please try again later.'
      }

      return res.status(400).json({ message: friendly })
    }

    // Get user info from the successful response
    const user = result.user || result

    // Update our local database with the new password and generate new refresh token
    let newRefreshToken = null
    let userId = null
    if (user && user.email) {
      // Find the user ID from our database
      const { data: localUser } = await supabase.from('users').select('id').eq('email', user.email).single()
      userId = localUser?.id
      
      if (userId) {
        // Generate new password hash for our local database
        const salt = generateSalt()
        const passwordHash = hashPassword(newPassword, salt)
        
        // Generate a new refresh token after password reset
        newRefreshToken = makeRefreshToken(userId)
        
        await supabase.from('users').update({ 
          password_hash: passwordHash,
          salt: salt,
          refresh_token: newRefreshToken
        }).eq('id', userId)
      }
    }

    res.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('[confirmPasswordReset] Error:', error.message)
    res.status(400).json({ message: 'Invalid or expired access token' })
  }
}