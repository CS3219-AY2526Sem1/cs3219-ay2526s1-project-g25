import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../server.js';
import * as supabaseModule from '../services/supabaseClient.js';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret';

// Helper to create JWT tokens for testing
function createToken(userId, roles) {
  return jwt.sign({ userId, roles }, ACCESS_SECRET, { expiresIn: '15m' });
}

// Mock supabase
function mockFrom(returnMap) {
  supabaseModule.supabase.from = jest.fn().mockImplementation(() => returnMap);
}

describe('Authentication Middleware', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Public Endpoints', () => {
    it('GET /questions - should work without authentication', async () => {
      // Chain: supabase.from('questions').select('*').eq('topic', v).eq('difficulty', v).order('created_at', { ascending: false })
      const query = {
        eq: function() { return this; },
        order: async () => ({ data: [], error: null })
      };
      
      mockFrom({
        select: () => query
      });

      const res = await request(app).get('/questions');
      expect(res.status).toBe(200);
    });

    it('GET /questions/:id - should work without authentication', async () => {
      mockFrom({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ 
              data: { id: '123', title: 'Test', description: 'Test', difficulty: 'easy', topic: 'Math', test_cases: {} }, 
              error: null 
            })
          })
        })
      });

      const res = await request(app).get('/questions/123');
      expect(res.status).toBe(200);
    });

    it('GET /questions/random - should work without authentication', async () => {
      const data = [{ id: '1', title: 'Test', description: 'Test', difficulty: 'easy', topic: 'Math', test_cases: {} }];
      const thenable = {
        eq: () => thenable,
        then: (resolve) => resolve({ data, error: null })
      };
      
      mockFrom({
        select: () => thenable
      });

      const res = await request(app).get('/questions/random');
      expect(res.status).toBe(200);
    });
  });

  describe('Admin-Only Endpoints - No Token', () => {
    it('POST /questions - should reject without token', async () => {
      const res = await request(app)
        .post('/questions')
        .send({
          title: 'Test',
          description: 'Test description',
          difficulty: 'easy',
          topic: 'Math',
          test_cases: { cases: [] }
        });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('PUT /questions/:id - should reject without token', async () => {
      const res = await request(app)
        .put('/questions/123')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('DELETE /questions/:id - should reject without token', async () => {
      const res = await request(app)
        .delete('/questions/123');
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });
  });

  describe('Admin-Only Endpoints - Invalid Token', () => {
    it('POST /questions - should reject with invalid token', async () => {
      const res = await request(app)
        .post('/questions')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          title: 'Test',
          description: 'Test description',
          difficulty: 'easy',
          topic: 'Math',
          test_cases: { cases: [] }
        });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('PUT /questions/:id - should reject with malformed authorization header', async () => {
      const res = await request(app)
        .put('/questions/123')
        .set('Authorization', 'InvalidFormat token_here')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });
  });

  describe('Admin-Only Endpoints - Non-Admin User', () => {
    it('POST /questions - should reject user without admin role', async () => {
      const token = createToken('user123', ['user']);
      
      const res = await request(app)
        .post('/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test',
          description: 'Test description',
          difficulty: 'easy',
          topic: 'Math',
          test_cases: { cases: [] }
        });
      
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: Admin access required');
    });

    it('PUT /questions/:id - should reject user without admin role', async () => {
      const token = createToken('user123', ['user']);
      
      const res = await request(app)
        .put('/questions/123')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: Admin access required');
    });

    it('DELETE /questions/:id - should reject user without admin role', async () => {
      const token = createToken('user123', ['user']);
      
      const res = await request(app)
        .delete('/questions/123')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: Admin access required');
    });
  });

  describe('Admin-Only Endpoints - Admin User', () => {
    it('POST /questions - should allow admin user', async () => {
      const token = createToken('admin123', ['admin']);
      
      const created = {
        id: '123',
        title: 'Test',
        description: 'Test description',
        difficulty: 'easy',
        topic: 'Math',
        test_cases: { cases: [] }
      };

      mockFrom({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: created, error: null })
          })
        })
      });
      
      const res = await request(app)
        .post('/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: created.title,
          description: created.description,
          difficulty: created.difficulty,
          topic: created.topic,
          test_cases: created.test_cases
        });
      
      expect(res.status).toBe(201);
      expect(res.body.id).toBe('123');
    });

    it('PUT /questions/:id - should allow admin user', async () => {
      const token = createToken('admin123', ['admin']);
      
      mockFrom({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: { id: '123', title: 'Updated' }, error: null })
            })
          })
        })
      });
      
      const res = await request(app)
        .put('/questions/123')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(200);
    });

    it('DELETE /questions/:id - should allow admin user', async () => {
      const token = createToken('admin123', ['admin']);
      
      mockFrom({
        delete: () => ({
          eq: async () => ({ error: null })
        })
      });
      
      const res = await request(app)
        .delete('/questions/123')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(204);
    });

    it('should allow user with multiple roles including admin', async () => {
      const token = createToken('admin123', ['user', 'admin', 'moderator']);
      
      const created = {
        id: '123',
        title: 'Test',
        description: 'Test description',
        difficulty: 'easy',
        topic: 'Math',
        test_cases: { cases: [] }
      };

      mockFrom({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: created, error: null })
          })
        })
      });
      
      const res = await request(app)
        .post('/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: created.title,
          description: created.description,
          difficulty: created.difficulty,
          topic: created.topic,
          test_cases: created.test_cases
        });
      
      expect(res.status).toBe(201);
    });
  });
});

