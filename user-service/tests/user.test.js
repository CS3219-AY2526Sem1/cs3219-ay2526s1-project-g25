import request from 'supertest'
import app from '../src/index.js'
import { supabase } from '../src/services/supabaseClient.js'

describe('User API', () => {
  let token
  let userId
  const testUser = {
    username: 'profileuser',
    email: 'profile@example.com',
    password: 'Str0ngP@ssword!!',
    confirmPassword: 'Str0ngP@ssword!!'
  }

  const testUser2 = {
    username: 'profileuser2',
    email: 'profile2@example.com',
    password: 'Str0ngP@ssword!!',
    confirmPassword: 'Str0ngP@ssword!!'
  }

  beforeAll(async () => {
    // Create and activate test users
    await request(app).post('/auth/register').send(testUser)
    await request(app).post('/auth/register').send(testUser2)
    await supabase.from('users').update({ is_active: true }).eq('email', testUser.email)
    await supabase.from('users').update({ is_active: true }).eq('email', testUser2.email)

    const loginRes = await request(app).post('/auth/login').send({
      identifier: testUser.email,
      password: testUser.password
    })
    token = loginRes.body.accessToken
    userId = loginRes.body.user.id
  })

  afterAll(async () => {
    await supabase.from('users').delete().eq('email', testUser.email)
    await supabase.from('users').delete().eq('email', testUser2.email)
  })

  describe('Get Profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body.email).toBe(testUser.email)
      expect(res.body.username).toBe(testUser.username)
      expect(res.body).toHaveProperty('id')
      expect(res.body).toHaveProperty('created_at')
      expect(res.body).not.toHaveProperty('password_hash')
      expect(res.body).not.toHaveProperty('salt')
    })

    it('should reject profile request without token', async () => {
      const res = await request(app).get('/users/me')
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Missing token')
    })

    it('should reject profile request with invalid token', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid or expired token')
    })
  })

  describe('Update Profile', () => {
    it('should update profile picture only', async () => {
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ profilePic: 'https://img.com/avatar.png' })
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Profile updated')
    })

    it('should update email with current password', async () => {
      const newEmail = 'newemail@example.com'
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          email: newEmail, 
          currentPassword: testUser.password 
        })
      expect(res.statusCode).toBe(200)
      
      // Verify email was updated
      const profileRes = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
      expect(profileRes.body.email).toBe(newEmail)
      
      // Revert email change
      await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          email: testUser.email, 
          currentPassword: testUser.password 
        })
    })

    it('should update password with current password', async () => {
      const newPassword = 'NewStr0ngP@ssword!!'
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          newPassword,
          currentPassword: testUser.password 
        })
      expect(res.statusCode).toBe(200)
      
      // Test login with new password
      const loginRes = await request(app).post('/auth/login').send({
        identifier: testUser.email,
        password: newPassword
      })
      expect(loginRes.statusCode).toBe(200)
      
      // Revert password change
      await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ 
          newPassword: testUser.password,
          currentPassword: newPassword 
        })
    })

    it('should reject email update without current password', async () => {
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'new@example.com' })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid current password')
    })

    it('should reject password update without current password', async () => {
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'NewPassword123!!' })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid current password')
    })

    it('should reject update with wrong current password', async () => {
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          email: 'new@example.com',
          currentPassword: 'wrongpassword' 
        })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid current password')
    })

    it('should reject update without token', async () => {
      const res = await request(app)
        .patch('/users/me')
        .send({ profilePic: 'https://img.com/avatar.png' })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Missing token')
    })
  })

  describe('Delete Account', () => {
    let deleteToken
    let deleteUserId

    beforeAll(async () => {
      // Create a separate user for deletion tests
      const deleteUser = {
        username: 'deleteuser',
        email: 'delete@example.com', 
        password: 'Str0ngP@ssword!!',
        confirmPassword: 'Str0ngP@ssword!!'
      }
      
      await request(app).post('/auth/register').send(deleteUser)
      await supabase.from('users').update({ is_active: true }).eq('email', deleteUser.email)

      const loginRes = await request(app).post('/auth/login').send({
        identifier: deleteUser.email,
        password: deleteUser.password
      })
      deleteToken = loginRes.body.accessToken
      deleteUserId = loginRes.body.user.id
    })

    it('should delete account with valid password', async () => {
      const res = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${deleteToken}`)
        .send({ currentPassword: 'Str0ngP@ssword!!' })
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Account deleted')
      
      // Verify user is deleted
      const { data: users } = await supabase.from('users').select('*').eq('id', deleteUserId)
      expect(users.length).toBe(0)
    })

    it('should reject account deletion without password', async () => {
      const res = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({})
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid password')
    })

    it('should reject account deletion with wrong password', async () => {
      const res = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongpassword' })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Invalid password')
    })

    it('should reject account deletion without token', async () => {
      const res = await request(app)
        .delete('/users/me')
        .send({ currentPassword: 'password' })
      expect(res.statusCode).toBe(401)
      expect(res.body.message).toBe('Missing token')
    })
  })
})