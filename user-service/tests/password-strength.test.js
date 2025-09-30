// Test the password strength function from authController
// Since it's not exported, we'll test it through the API endpoints
import request from 'supertest'
import app from '../src/index.js'
import { supabase } from '../src/services/supabaseClient.js'

describe('Password Strength Validation', () => {
  afterEach(async () => {
    // Clean up any test users
    await supabase.from('users').delete().eq('email', 'strength@example.com')
  })

  describe('Registration Password Validation', () => {
    const baseUser = {
      username: 'strengthuser',
      email: 'strength@example.com',
      confirmPassword: 'same'
    }

    it('should accept strong password (12+ chars, upper, lower, number, special)', async () => {
      const strongPassword = 'StrongP@ssw0rd!'
      const res = await request(app).post('/auth/register').send({
        ...baseUser,
        password: strongPassword,
        confirmPassword: strongPassword
      })
      expect(res.statusCode).toBe(201)
    })

    it('should reject password shorter than 12 characters', async () => {
      const shortPassword = 'Short1!'
      const res = await request(app).post('/auth/register').send({
        ...baseUser,
        password: shortPassword,
        confirmPassword: shortPassword
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Password too weak')
    })

    it('should reject password without uppercase letters', async () => {
      const noUpperPassword = 'longpassword123!'
      const res = await request(app).post('/auth/register').send({
        ...baseUser,
        password: noUpperPassword,
        confirmPassword: noUpperPassword
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Password too weak')
    })

    it('should reject password without lowercase letters', async () => {
      const noLowerPassword = 'LONGPASSWORD123!'
      const res = await request(app).post('/auth/register').send({
        ...baseUser,
        password: noLowerPassword,
        confirmPassword: noLowerPassword
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Password too weak')
    })

    it('should reject password without numbers', async () => {
      const noNumberPassword = 'LongPassword!!'
      const res = await request(app).post('/auth/register').send({
        ...baseUser,
        password: noNumberPassword,
        confirmPassword: noNumberPassword
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Password too weak')
    })

    it('should reject password without special characters', async () => {
      const noSpecialPassword = 'LongPassword123'
      const res = await request(app).post('/auth/register').send({
        ...baseUser,
        password: noSpecialPassword,
        confirmPassword: noSpecialPassword
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Password too weak')
    })

    it('should accept password with various special characters', async () => {
      const specialCharsPassword = 'StrongP@ssw0rd#$%^&*()'
      const res = await request(app).post('/auth/register').send({
        ...baseUser,
        password: specialCharsPassword,
        confirmPassword: specialCharsPassword
      })
      expect(res.statusCode).toBe(201)
    })

    it('should accept exactly 12 character strong password', async () => {
      const exactPassword = 'StrongP@ss1!'
      const res = await request(app).post('/auth/register').send({
        ...baseUser,
        password: exactPassword,
        confirmPassword: exactPassword
      })
      expect(res.statusCode).toBe(201)
    })
  })

  describe('Password Reset Validation', () => {
    it('should reject weak password in reset', async () => {
      // Create a mock reset token (doesn't need to be valid for this test)
      const res = await request(app).post('/auth/password-reset/confirm').send({
        token: 'mock-token',
        newPassword: 'weak'
      })
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Password too weak')
    })
  })
})