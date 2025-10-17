import request from 'supertest'
import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'test_access_secret_key_for_testing_purposes_only'

// Create test app
const app = express()
app.use(express.json())

// Test routes
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected route accessed', userId: req.userId, roles: req.roles })
})

app.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  res.json({ message: 'Admin route accessed' })
})

describe('Auth Middleware', () => {
  describe('authenticateToken', () => {
    it('should allow access with valid token', async () => {
      const token = jwt.sign({ userId: 1, roles: ['user'] }, ACCESS_SECRET, { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
      
      expect(res.statusCode).toBe(200)
      expect(res.body.userId).toBe(1)
      expect(res.body.roles).toEqual(['user'])
    })

    it('should allow access with token containing no roles', async () => {
      const token = jwt.sign({ userId: 1 }, ACCESS_SECRET, { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
      
      expect(res.statusCode).toBe(200)
      expect(res.body.userId).toBe(1)
      expect(res.body.roles).toEqual([])
    })

    it('should reject request without authorization header', async () => {
      const res = await request(app).get('/protected')
      
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Missing token')
    })

    it('should reject request with malformed authorization header', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat')
      
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Missing token')
    })

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
      
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid or expired token')
    })

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign({ userId: 1, roles: ['user'] }, ACCESS_SECRET, { expiresIn: '-1h' })
      
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
      
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid or expired token')
    })

    it('should reject request with token signed with wrong secret', async () => {
      const wrongToken = jwt.sign({ userId: 1, roles: ['user'] }, 'wrong-secret', { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${wrongToken}`)
      
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid or expired token')
    })
  })

  describe('requireAdmin', () => {
    it('should allow access for admin user', async () => {
      const adminToken = jwt.sign({ userId: 1, roles: ['admin'] }, ACCESS_SECRET, { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${adminToken}`)
      
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Admin route accessed')
    })

    it('should allow access for user with multiple roles including admin', async () => {
      const adminToken = jwt.sign({ userId: 1, roles: ['user', 'admin', 'moderator'] }, ACCESS_SECRET, { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${adminToken}`)
      
      expect(res.statusCode).toBe(200)
    })

    it('should reject access for non-admin user', async () => {
      const userToken = jwt.sign({ userId: 1, roles: ['user'] }, ACCESS_SECRET, { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${userToken}`)
      
      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Admin required')
    })

    it('should reject access for user with no roles', async () => {
      const userToken = jwt.sign({ userId: 1, roles: [] }, ACCESS_SECRET, { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${userToken}`)
      
      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Admin required')
    })

    it('should reject access for user with undefined roles', async () => {
      const userToken = jwt.sign({ userId: 1 }, ACCESS_SECRET, { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${userToken}`)
      
      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Admin required')
    })

    it('should reject access for user with null roles', async () => {
      const userToken = jwt.sign({ userId: 1, roles: null }, ACCESS_SECRET, { expiresIn: '15m' })
      
      const res = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${userToken}`)
      
      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Admin required')
    })

    it('should reject access without token (should be caught by authenticateToken first)', async () => {
      const res = await request(app).get('/admin')
      
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Missing token')
    })
  })
})