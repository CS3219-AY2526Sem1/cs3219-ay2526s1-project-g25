import { incrementDifficulty, getDifficultyCounts, resetDifficultyCounts } from '../src/services/difficultyService.js'
import { supabase } from '../src/services/supabaseClient.js'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/index.js'

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret'

describe('Difficulty Service', () => {
  let testUserId
  
  beforeAll(async () => {
    // Create a test user
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        username: 'testuser_difficulty', 
        email: 'test.difficulty@example.com',
        password_hash: 'dummy_hash',
        salt: 'dummy_salt',
        is_active: true
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create test user:', error)
      throw error
    }
    testUserId = data.id
  })

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId)
    }
  })

  beforeEach(async () => {
    // Reset counts before each test
    await resetDifficultyCounts(testUserId)
  })

  test('should increment easy difficulty count', async () => {
    const result = await incrementDifficulty(testUserId, 'easy')
    expect(result.easy).toBe(1)
    expect(result.medium).toBe(0)
    expect(result.hard).toBe(0)
  })

  test('should increment multiple difficulties', async () => {
    await incrementDifficulty(testUserId, 'easy', 3)
    await incrementDifficulty(testUserId, 'medium', 2)
    
    const counts = await getDifficultyCounts(testUserId)
    expect(counts.easy).toBe(3)
    expect(counts.medium).toBe(2)
    expect(counts.hard).toBe(0)
  })

  test('should handle invalid difficulty level', async () => {
    await expect(incrementDifficulty(testUserId, 'invalid'))
      .rejects.toThrow('Invalid difficulty level')
  })

  test('should reset all counts to zero', async () => {
    // Set some counts first
    await incrementDifficulty(testUserId, 'easy', 5)
    await incrementDifficulty(testUserId, 'hard', 2)
    
    // Reset counts
    await resetDifficultyCounts(testUserId)
    
    // Verify reset
    const counts = await getDifficultyCounts(testUserId)
    expect(counts.easy).toBe(0)
    expect(counts.medium).toBe(0)
    expect(counts.hard).toBe(0)
  })

})

describe('Difficulty Controller API', () => {
  let testUserId
  let authToken

  beforeAll(async () => {
    // Create a test user for controller tests
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        username: 'testuser_controller', 
        email: 'test.controller@example.com',
        password_hash: 'dummy_hash',
        salt: 'dummy_salt',
        is_active: true
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create test user:', error)
      throw error
    }
    testUserId = data.id
    
    // Create auth token for the test user
    authToken = jwt.sign({ userId: testUserId }, ACCESS_SECRET, { expiresIn: '1h' })
  })

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId)
    }
  })

  beforeEach(async () => {
    // Reset counts before each test
    await resetDifficultyCounts(testUserId)
  })

  describe('POST /api/difficulty/solve', () => {
    it('should mark a question as solved and increment count', async () => {
      const res = await request(app)
        .post('/api/difficulty/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ difficulty: 'easy' })

      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('easy question solved!')
      expect(res.body.difficulty_counts.easy).toBe(1)
      expect(res.body.difficulty_counts.medium).toBe(0)
      expect(res.body.difficulty_counts.hard).toBe(0)
    })

    it('should handle multiple difficulty levels', async () => {
      // Solve easy question
      await request(app)
        .post('/api/difficulty/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ difficulty: 'easy' })

      // Solve medium question
      const res = await request(app)
        .post('/api/difficulty/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ difficulty: 'medium' })

      expect(res.statusCode).toBe(200)
      expect(res.body.difficulty_counts.easy).toBe(1)
      expect(res.body.difficulty_counts.medium).toBe(1)
      expect(res.body.difficulty_counts.hard).toBe(0)
    })

    it('should return 400 for missing difficulty', async () => {
      const res = await request(app)
        .post('/api/difficulty/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Difficulty level is required')
    })

    it('should return 400 for invalid difficulty level', async () => {
      const res = await request(app)
        .post('/api/difficulty/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ difficulty: 'invalid' })

      expect(res.statusCode).toBe(500)
      expect(res.body.message).toBe('Failed to update difficulty count')
    })

    it('should return 401 for missing authorization', async () => {
      const res = await request(app)
        .post('/api/difficulty/solve')
        .send({ difficulty: 'easy' })

      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET /api/difficulty/counts', () => {
    it('should get difficulty counts for authenticated user', async () => {
      // Set some counts first
      await incrementDifficulty(testUserId, 'easy', 3)
      await incrementDifficulty(testUserId, 'hard', 1)

      const res = await request(app)
        .get('/api/difficulty/counts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.user_id).toBe(testUserId)
      expect(res.body.difficulty_counts.easy).toBe(3)
      expect(res.body.difficulty_counts.medium).toBe(0)
      expect(res.body.difficulty_counts.hard).toBe(1)
    })

    it('should return zero counts for new user', async () => {
      const res = await request(app)
        .get('/api/difficulty/counts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.difficulty_counts.easy).toBe(0)
      expect(res.body.difficulty_counts.medium).toBe(0)
      expect(res.body.difficulty_counts.hard).toBe(0)
    })

    it('should return 401 for missing authorization', async () => {
      const res = await request(app)
        .get('/api/difficulty/counts')

      expect(res.statusCode).toBe(401)
    })
  })

  describe('DELETE /api/difficulty/counts', () => {
    it('should reset difficulty counts to zero', async () => {
      // Set some counts first
      await incrementDifficulty(testUserId, 'easy', 5)
      await incrementDifficulty(testUserId, 'medium', 3)
      await incrementDifficulty(testUserId, 'hard', 2)

      const res = await request(app)
        .delete('/api/difficulty/counts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Difficulty counts reset successfully')
      expect(res.body.difficulty_counts.easy).toBe(0)
      expect(res.body.difficulty_counts.medium).toBe(0)
      expect(res.body.difficulty_counts.hard).toBe(0)

      // Verify counts are actually reset in database
      const counts = await getDifficultyCounts(testUserId)
      expect(counts.easy).toBe(0)
      expect(counts.medium).toBe(0)
      expect(counts.hard).toBe(0)
    })

    it('should return 401 for missing authorization', async () => {
      const res = await request(app)
        .delete('/api/difficulty/counts')

      expect(res.statusCode).toBe(401)
    })
  })

  describe('PUT /api/difficulty/batch', () => {
    it('should batch update difficulty counts', async () => {
      const increments = { easy: 5, medium: 3, hard: 2 }

      const res = await request(app)
        .put('/api/difficulty/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ increments })

      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Difficulty counts updated successfully')
      expect(res.body.difficulty_counts.easy).toBe(5)
      expect(res.body.difficulty_counts.medium).toBe(3)
      expect(res.body.difficulty_counts.hard).toBe(2)
    })

    it('should handle partial increments', async () => {
      const increments = { easy: 3 } // Only easy difficulty

      const res = await request(app)
        .put('/api/difficulty/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ increments })

      expect(res.statusCode).toBe(200)
      expect(res.body.difficulty_counts.easy).toBe(3)
      expect(res.body.difficulty_counts.medium).toBe(0)
      expect(res.body.difficulty_counts.hard).toBe(0)
    })

    it('should return 400 for missing increments', async () => {
      const res = await request(app)
        .put('/api/difficulty/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Increments object is required')
    })

    it('should return 400 for invalid increments format', async () => {
      const res = await request(app)
        .put('/api/difficulty/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ increments: 'invalid' })

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Increments object is required')
    })

    it('should return 401 for missing authorization', async () => {
      const res = await request(app)
        .put('/api/difficulty/batch')
        .send({ increments: { easy: 1 } })

      expect(res.statusCode).toBe(401)
    })
  })
})