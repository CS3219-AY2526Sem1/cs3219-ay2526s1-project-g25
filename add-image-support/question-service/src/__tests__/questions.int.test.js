import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../server.js';
import { supabase } from '../services/supabaseClient.js';

describe('Health endpoint', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('Create question validation', () => {
  it('POST /questions should 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/questions')
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});


describe('Create question (valid)', () => {
  const originalFrom = supabase.from;

  afterEach(() => {
    // restore original implementation after each test
    supabase.from = originalFrom;
    jest.clearAllMocks();
  });

  it('POST /questions returns 201 and body of created question', async () => {
    const created = {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Calculate Power',
      description: 'pow(x, n) using fast exponentiation.',
      difficulty: 'medium',
      topic: 'Math',
      test_cases: { cases: [{ input: { x: 2, n: 10 }, expected: 1024 }] },
      created_at: '2025-09-25T00:00:00.000Z',
    };

    // Stub the supabase insert chain
    supabase.from = jest.fn().mockReturnValue({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: created, error: null }),
        }),
      }),
    });

    const payload = {
      title: created.title,
      description: created.description,
      difficulty: created.difficulty,
      topic: created.topic,
      test_cases: created.test_cases,
    };

    const res = await request(app).post('/questions').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: created.id,
      title: created.title,
      difficulty: created.difficulty,
      topic: created.topic,
    });
    expect(supabase.from).toHaveBeenCalledWith('questions');
  });
});


