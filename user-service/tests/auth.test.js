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
      expect(res.body).toHaveProperty('errors')
    })
  })

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      // Register user for verification test
      const registerRes = await request(app).post('/auth/register').send(testUser2)
      
      // Extract token from registration response (test environment only)
      const token = registerRes.body.verificationToken
      
      const res = await request(app).get(`/auth/verify?token=${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toContain('verified')
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
  })
})