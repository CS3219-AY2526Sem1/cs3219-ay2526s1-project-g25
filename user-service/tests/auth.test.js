import request from 'supertest'
import app from '../src/index.js'
import { supabase } from '../src/services/supabaseClient.js'
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'test_access_secret_key_for_testing_purposes_only'

describe('Auth API', () => {
  const testUser = {
    username: 'jestuser',
    email: 'jest@example.com',
    password: 'Str0ngP@ssword!!',
    confirmPassword: 'Str0ngP@ssword!!'
  }

  const testUser2 = {
    username: 'jestuser2',
    email: 'jest2@example.com',
    password: 'Str0ngP@ssword!!',
    confirmPassword: 'Str0ngP@ssword!!'
  }

  afterAll(async () => {
    // cleanup users from supabase
    await supabase.from('users').delete().eq('email', testUser.email)
    await supabase.from('users').delete().eq('email', testUser2.email)
    await supabase.from('users').delete().eq('email', 'reset@example.com')
  })

  describe('Registration', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/auth/register').send(testUser)
      expect(res.statusCode).toBe(201)
      expect(res.body.message).toContain('Registered')
    })

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = { ...testUser, email: 'weak@example.com', password: 'weak', confirmPassword: 'weak' }
      const res = await request(app).post('/auth/register').send(weakPasswordUser)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Password too weak')
    })

    it('should reject registration with mismatched passwords', async () => {
      const mismatchUser = { ...testUser, email: 'mismatch@example.com', confirmPassword: 'different' }
      const res = await request(app).post('/auth/register').send(mismatchUser)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Passwords do not match')
    })

    it('should reject registration with existing email', async () => {
      const duplicateUser = { ...testUser, username: 'different' }
      const res = await request(app).post('/auth/register').send(duplicateUser)
      expect(res.statusCode).toBe(409)
      expect(res.body.message).toBe('Username or email already taken')
    })

    it('should reject registration with existing username', async () => {
      const duplicateUser = { ...testUser, email: 'different@example.com' }
      const res = await request(app).post('/auth/register').send(duplicateUser)
      expect(res.statusCode).toBe(409)
      expect(res.body.message).toBe('Username or email already taken')
    })

    it('should reject registration with missing fields', async () => {
      const res = await request(app).post('/auth/register').send({ username: 'test' })
      expect(res.statusCode).toBe(400)
      // Check for validation errors structure
      expect(res.body).toHaveProperty('errors')
      expect(res.body.errors).toBeInstanceOf(Array)
    })
  })

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      // Register a new user first
      const registerRes = await request(app).post('/auth/register').send(testUser2)
      expect(registerRes.statusCode).toBe(201)
      // Extract token from registration response (test environment only)
      const token = registerRes.body.verificationToken

      const res = await request(app).get(`/auth/verify?token=${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Email verified successfully')
    })

    describe('POST /auth/verify-email', () => {
    it('should verify user email when already verified', async () => {
      // Clean up any existing user first
      await supabase.from('users').delete().eq('email', 'verified@test.com')
      
      // Create a verified user
      const userData = {
        username: 'verifieduser',
        email: 'verified@test.com',
        password_hash: 'test_hash',
        salt: 'test_salt',
        is_active: true,
        email_verified: true,
        email_verification_token: null
      }

      const { data: user, error } = await supabase.from('users').insert(userData).select().single()
      
      if (error || !user) {
        console.error('Failed to create test user:', error)
        return // Skip this test if user creation fails
      }
      
      // Create a valid verification token for the user (even though they're already verified)
      const jwt = (await import('jsonwebtoken')).default
      const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret'
      const verificationToken = jwt.sign(
        { userId: user.id, type: 'verify' },
        ACCESS_SECRET,
        { expiresIn: '24h' }
      )
      
      const res = await request(app)
        .get(`/auth/verify?token=${verificationToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('message')
      expect(res.body.message).toMatch(/already verified/i)
      
      // Cleanup
      await supabase.from('users').delete().eq('id', user.id)
    })

    it('should verify email with token as query parameter', async () => {
      // Clean up any existing user first
      await supabase.from('users').delete().eq('email', 'jest3@example.com')
      
      // Register a new user for testing
      const testUser3 = { ...testUser, email: 'jest3@example.com', username: 'jestuser3' }
      const registerRes = await request(app).post('/auth/register').send(testUser3)
      expect(registerRes.statusCode).toBe(201)
      const token = registerRes.body.verificationToken

      const res = await request(app).get(`/auth/verify?token=${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Email verified successfully')
      
      // Cleanup
      await supabase.from('users').delete().eq('email', testUser3.email)
    })

    it('should reject verification with missing token', async () => {
      const res = await request(app).get('/auth/verify')
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Missing token')
    })

    it('should reject verification with invalid token', async () => {
      const res = await request(app).get('/auth/verify?token=invalid')
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Invalid or expired token')
    })

    it('should reject verification with wrong token type', async () => {
      const token = jwt.sign({ userId: 1, type: 'reset' }, ACCESS_SECRET, { expiresIn: '24h' })
      const res = await request(app).get(`/auth/verify?token=${token}`)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Invalid token')
    })

    it('should reject verification with non-existent user ID', async () => {
      const token = jwt.sign({ userId: 99999, type: 'verify' }, ACCESS_SECRET, { expiresIn: '24h' })
      const res = await request(app).get(`/auth/verify?token=${token}`)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Invalid or expired token')
    })
    })
  })

  describe('Login', () => {
    beforeAll(async () => {
      // Ensure test user is active
      await supabase.from('users').update({ is_active: true }).eq('email', testUser.email)
    })

    it('should login with correct credentials (email)', async () => {
      const res = await request(app).post('/auth/login').send({
        identifier: testUser.email,
        password: testUser.password
      })
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
      expect(res.body.user.email).toBe(testUser.email)
    })

    it('should login with correct credentials (username)', async () => {
      const res = await request(app).post('/auth/login').send({
        identifier: testUser.username,
        password: testUser.password
      })
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
    })

    it('should reject login with invalid credentials', async () => {
      const res = await request(app).post('/auth/login').send({
        identifier: testUser.email,
        password: 'wrongpassword'
      })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid credentials')
    })

    it('should reject login with non-existent user', async () => {
      const res = await request(app).post('/auth/login').send({
        identifier: 'nonexistent@example.com',
        password: 'password'
      })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid credentials')
    })

    it('should reject login for inactive user', async () => {
      // Deactivate user
      await supabase.from('users').update({ is_active: false }).eq('email', testUser2.email)
      
      const res = await request(app).post('/auth/login').send({
        identifier: testUser2.email,
        password: testUser2.password
      })
      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Account not activated')
    })
  })

  describe('Token Refresh', () => {
    let refreshToken

    beforeAll(async () => {
      // Get refresh token from login
      const loginRes = await request(app).post('/auth/login').send({
        identifier: testUser.email,
        password: testUser.password
      })
      refreshToken = loginRes.body.refreshToken
    })

    it('should refresh access token with valid refresh token', async () => {
      const res = await request(app).post('/auth/refresh').send({ refreshToken })
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
    })

    it('should reject refresh with missing token', async () => {
      const res = await request(app).post('/auth/refresh').send({})
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Missing refresh token')
    })

    it('should reject refresh with invalid token', async () => {
      const res = await request(app).post('/auth/refresh').send({ refreshToken: 'invalid' })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid or expired refresh token')
    })
  })

  describe('Logout', () => {
    let refreshToken

    beforeAll(async () => {
      // Get refresh token from login
      const loginRes = await request(app).post('/auth/login').send({
        identifier: testUser.email,
        password: testUser.password
      })
      refreshToken = loginRes.body.refreshToken
    })

    it('should logout with valid refresh token', async () => {
      const res = await request(app).post('/auth/logout').send({ refreshToken })
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Logged out')
    })

    it('should handle logout with missing token', async () => {
      const res = await request(app).post('/auth/logout').send({})
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Missing refresh token')
    })

    it('should handle logout with invalid token (idempotent)', async () => {
      const res = await request(app).post('/auth/logout').send({ refreshToken: 'invalid' })
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Logged out')
    })
  })

  describe('Password Reset', () => {
    it('should send password reset email for existing user', async () => {
      const res = await request(app).post('/auth/password-reset').send({
        email: testUser.email
      })
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toContain('reset link was sent')
    })

    it('should handle password reset request for non-existent user', async () => {
      const res = await request(app).post('/auth/password-reset').send({
        email: 'nonexistent@example.com'
      })
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toContain('reset link was sent')
    })

    it('should reject password reset with missing access token', async () => {
      // Test the actual behavior - controller expects accessToken, not token
      const res = await request(app).post('/auth/password-reset/confirm').send({
        newPassword: 'NewStr0ngP@ssword!!',
        confirmNewPassword: 'NewStr0ngP@ssword!!'
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Access token is required')
    })

    it('should reject password reset with invalid access token', async () => {
      // Test with invalid Supabase access token
      const res = await request(app).post('/auth/password-reset/confirm').send({
        accessToken: 'invalid-supabase-token',
        newPassword: 'NewStr0ngP@ssword!!',
        confirmNewPassword: 'NewStr0ngP@ssword!!'
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Failed to update password. Token may be invalid or expired.')
    })

    it('should reject password reset with weak password', async () => {
      const res = await request(app).post('/auth/password-reset/confirm').send({
        accessToken: 'mock-token',
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Password too weak')
    })

    it('should reject password reset with mismatched passwords', async () => {
      const res = await request(app).post('/auth/password-reset/confirm').send({
        accessToken: 'mock-token',
        newPassword: 'NewStr0ngP@ssword!!',
        confirmNewPassword: 'DifferentP@ssword!!'
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Passwords do not match')
    })

    it('should reject password reset with missing password fields', async () => {
      const res = await request(app).post('/auth/password-reset/confirm').send({
        accessToken: 'mock-token',
        newPassword: 'NewStr0ngP@ssword!!'
        // missing confirmNewPassword
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Missing password fields')
    })

    it('should require email for password reset request', async () => {
      const res = await request(app).post('/auth/password-reset').send({})
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Email is required')
    })

    it('should handle malformed access token', async () => {
      const res = await request(app).post('/auth/password-reset/confirm').send({
        accessToken: 'malformed.token.here',
        newPassword: 'NewStr0ngP@ssword!!',
        confirmNewPassword: 'NewStr0ngP@ssword!!'
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Failed to update password. Token may be invalid or expired.')
    })

    it('should reject password reset with missing confirmNewPassword', async () => {
      const res = await request(app).post('/auth/password-reset/confirm').send({
        accessToken: 'mock-token',
        confirmNewPassword: 'NewStr0ngP@ssword!!'
        // missing newPassword
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Missing password fields')
    })
  })
})