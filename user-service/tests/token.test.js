import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/index.js'
import { supabase } from '../src/services/supabaseClient.js'
import { generateSalt, hashPassword } from '../src/utils/hash.js'

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret'

describe('Token Verification Endpoints', () => {
  let testUserId
  let adminUserId
  let testToken
  let adminToken

  beforeAll(async () => {
    // Clean up any existing test data
    await supabase.from('users').delete().ilike('email', '%tokentest%')

    // Create regular user with proper password hash and salt
    const regularSalt = generateSalt()
    const regularPasswordHash = hashPassword('test_password', regularSalt)
    
    const { data: regularUser, error: regularUserError } = await supabase
      .from('users')
      .insert({
        username: 'tokentest',
        email: 'tokentest@example.com',
        password_hash: regularPasswordHash,
        salt: regularSalt,
        roles: ['user'],
        is_active: true
      })
      .select()

    if (regularUserError || !regularUser || regularUser.length === 0) {
      throw new Error(`Failed to create test user: ${regularUserError?.message || 'No data returned'}`)
    }

    testUserId = regularUser[0].id
    testToken = jwt.sign({ userId: testUserId, roles: ['user'] }, ACCESS_SECRET)

    // Create admin user with proper password hash and salt
    const adminSalt = generateSalt()
    const adminPasswordHash = hashPassword('admin_password', adminSalt)
    
    const { data: adminUser, error: adminUserError } = await supabase
      .from('users')
      .insert({
        username: 'admintokentest',
        email: 'admintokentest@example.com',
        password_hash: adminPasswordHash,
        salt: adminSalt,
        roles: ['admin'],
        is_active: true
      })
      .select()

    if (adminUserError || !adminUser || adminUser.length === 0) {
      throw new Error(`Failed to create admin user: ${adminUserError?.message || 'No data returned'}`)
    }

    adminUserId = adminUser[0].id
    adminToken = jwt.sign({ userId: adminUserId, roles: ['admin'] }, ACCESS_SECRET)
  })

  afterAll(async () => {
    // Clean up test data
    await supabase.from('users').delete().eq('id', testUserId)
    await supabase.from('users').delete().eq('id', adminUserId)
  })

  describe('POST /api/token/verify', () => {
    it('should verify valid token and return user info', async () => {
      const response = await request(app)
        .post('/api/token/verify')
        .send({ token: testToken })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        valid: true,
        user: {
          id: testUserId,
          username: 'tokentest',
          email: 'tokentest@example.com',
          roles: ['user'],
          isAdmin: false
        }
      })
    })

    it('should verify admin token correctly', async () => {
      const response = await request(app)
        .post('/api/token/verify')
        .send({ token: adminToken })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        valid: true,
        user: expect.objectContaining({
          id: adminUserId,
          username: 'admintokentest',
          email: 'admintokentest@example.com',
          roles: ['admin'],
          isAdmin: true
        })
      })
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/token/verify')
        .send({ token: 'invalid_token' })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        valid: false,
        message: 'Invalid or expired token'
      })
    })

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/api/token/verify')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        valid: false,
        message: 'Token required'
      })
    })
  })

  describe('POST /api/token/verify-admin', () => {
    it('should verify admin token and return true', async () => {
      const response = await request(app)
        .post('/api/token/verify-admin')
        .send({ token: adminToken })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        valid: true,
        isAdmin: true,
        userId: adminUserId,
        message: 'Admin verified'
      })
    })

    it('should verify regular user token but return false for admin', async () => {
      const response = await request(app)
        .post('/api/token/verify-admin')
        .send({ token: testToken })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        valid: true,
        isAdmin: false,
        userId: testUserId,
        message: 'User verified but not admin'
      })
    })

    it('should reject invalid token for admin check', async () => {
      const response = await request(app)
        .post('/api/token/verify-admin')
        .send({ token: 'invalid_token' })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        valid: false,
        isAdmin: false,
        message: 'Invalid or expired token'
      })
    })

    it('should reject missing token for admin check', async () => {
      const response = await request(app)
        .post('/api/token/verify-admin')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        valid: false,
        isAdmin: false,
        message: 'Token required'
      })
    })
  })

  describe('Edge cases and error handling', () => {
    let inactiveUserId
    let inactiveToken

    beforeAll(async () => {
      // Create inactive user for testing
      const inactiveSalt = generateSalt()
      const inactivePasswordHash = hashPassword('inactive_password', inactiveSalt)
      
      const { data: inactiveUser } = await supabase
        .from('users')
        .insert({
          username: 'inactiveuser',
          email: 'inactive@tokentest.com',
          password_hash: inactivePasswordHash,
          salt: inactiveSalt,
          roles: ['user'],
          is_active: false
        })
        .select()

      inactiveUserId = inactiveUser[0].id
      inactiveToken = jwt.sign({ userId: inactiveUserId, roles: ['user'] }, ACCESS_SECRET)
    })

    afterAll(async () => {
      await supabase.from('users').delete().eq('id', inactiveUserId)
    })

    it('should reject token for inactive user', async () => {
      const response = await request(app)
        .post('/api/token/verify')
        .send({ token: inactiveToken })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        valid: false,
        message: 'User not found or inactive'
      })
    })

    it('should reject inactive user for admin check', async () => {
      const response = await request(app)
        .post('/api/token/verify-admin')
        .send({ token: inactiveToken })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        valid: false,
        isAdmin: false,
        message: 'User not found or inactive'
      })
    })

    it('should reject token for non-existent user', async () => {
      const nonExistentToken = jwt.sign({ userId: 99999, roles: ['user'] }, ACCESS_SECRET)
      const response = await request(app)
        .post('/api/token/verify')
        .send({ token: nonExistentToken })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        valid: false,
        message: 'User not found or inactive'
      })
    })

    it('should reject non-existent user for admin check', async () => {
      const nonExistentToken = jwt.sign({ userId: 99999, roles: ['admin'] }, ACCESS_SECRET)
      const response = await request(app)
        .post('/api/token/verify-admin')
        .send({ token: nonExistentToken })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        valid: false,
        isAdmin: false,
        message: 'User not found or inactive'
      })
    })
  })
})