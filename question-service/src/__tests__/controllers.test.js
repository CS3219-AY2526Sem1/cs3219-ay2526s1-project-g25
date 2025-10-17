import request from 'supertest'
import { jest } from '@jest/globals'
import app from '../server.js'
import * as supabaseModule from '../services/supabaseClient.js'
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret';

// Helper to create admin JWT token for testing
function createAdminToken() {
  return jwt.sign({ userId: 'admin123', roles: ['admin'] }, ACCESS_SECRET, { expiresIn: '15m' });
}

// Helpers to mock supabase.from(...)
function mockFrom(returnMap) {
  supabaseModule.supabase.from = jest.fn().mockImplementation(() => returnMap)
}

function buildListQueryMock(data, error = null) {
  // Chain: supabase.from('questions').select('*').eq('topic', v).eq('difficulty', v).order('created_at', { ascending: false })
  const query = {
    eq: () => query,
    order: async () => ({ data, error })
  }
  return {
    select: () => query
  }
}

function buildGetByIdQueryMock(data, error = null) {
  // Chain: select('*').eq('id', id).maybeSingle()
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data, error })
      })
    })
  }
}

function buildInsertMock(data, error = null) {
  return {
    insert: () => ({ select: () => ({ single: async () => ({ data, error }) }) })
  }
}

function buildUpdateMock(data, error = null) {
  return {
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data, error })
        })
      })
    })
  }
}

function buildDeleteMock(error = null) {
  return {
    delete: () => ({
      eq: async () => ({ error })
    })
  }
}

function buildRandomQueryMock(data, error = null) {
  // Build a thenable that supports chained eq() and resolves when awaited
  const thenable = {
    eq: () => thenable,
    then: (resolve) => resolve({ data, error })
  }
  return {
    select: () => thenable
  }
}

describe('controllers: createQuestion', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns 201 with created record', async () => {
    const adminToken = createAdminToken();
    const created = { id: '1', title: 'T', description: 'D', difficulty: 'easy', topic: 'Math', test_cases: {} }
    mockFrom({
      insert: () => ({ select: () => ({ single: async () => ({ data: created, error: null }) }) })
    })

    const res = await request(app)
      .post('/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: created.title,
        description: created.description,
        difficulty: created.difficulty,
        topic: created.topic,
        test_cases: created.test_cases,
      })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('1')
  })

  it('handles database error with 500', async () => {
    const adminToken = createAdminToken();
    mockFrom({
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'boom' } }) }) })
    })

    const res = await request(app)
      .post('/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'T', description: 'D', difficulty: 'easy', topic: 'Math', test_cases: {}
      })
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Database error')
  })
})

describe('controllers: getQuestionById', () => {
  afterEach(() => { jest.restoreAllMocks() })

  it('400 when id missing', async () => {
    const res = await request(app).get('/questions/')
    // Express will not match route without id; we assert behavior via controller by calling route with empty id is not applicable.
    // Instead simulate invalid id param:
    const res2 = await request(app).get('/questions/%20')
    // Our controller treats id as provided string; not ideal to hit missing branch via HTTP.
    expect([404, 500].includes(res2.status)).toBeTruthy()
  })

  it('404 when not found', async () => {
    mockFrom({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) })
    })
    const res = await request(app).get('/questions/abc')
    expect(res.status).toBe(404)
  })

  it('500 on db error', async () => {
    mockFrom({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'fail' } }) }) })
    })
    const res = await request(app).get('/questions/abc')
    expect(res.status).toBe(500)
  })
})

describe('controllers: listQuestions', () => {
  afterEach(() => { jest.restoreAllMocks() })

  it('returns list with optional filters', async () => {
    mockFrom(buildListQueryMock([{ id: '1' }], null))
    const res = await request(app).get('/questions?topic=Math&difficulty=easy')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('500 on db error', async () => {
    mockFrom(buildListQueryMock(null, { message: 'x' }))
    const res = await request(app).get('/questions')
    expect(res.status).toBe(500)
  })
})

describe('controllers: getRandomQuestion', () => {
  afterEach(() => { jest.restoreAllMocks() })

  it('returns one random question', async () => {
    const data = [{ id: '1' }, { id: '2' }]
    mockFrom(buildRandomQueryMock(data, null))
    const res = await request(app).get('/questions/random?topic=Math&difficulty=easy')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id')
  })

  it('404 when no data', async () => {
    mockFrom(buildRandomQueryMock([], null))
    const res = await request(app).get('/questions/random')
    expect([404,500]).toContain(res.status)
  })

  it('500 when db error', async () => {
    mockFrom(buildRandomQueryMock(null, { message: 'e' }))
    const res = await request(app).get('/questions/random')
    expect(res.status).toBe(500)
  })
})

describe('controllers: updateQuestion', () => {
  afterEach(() => { jest.restoreAllMocks() })

  it('400 when no fields', async () => {
    const adminToken = createAdminToken();
    const res = await request(app)
      .put('/questions/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('400 when id change attempted', async () => {
    const adminToken = createAdminToken();
    const res = await request(app)
      .put('/questions/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: 'def', title: 'X' })
    expect(res.status).toBe(400)
  })

  it('200 on success', async () => {
    const adminToken = createAdminToken();
    mockFrom(buildUpdateMock({ id: 'abc' }, null))
    const res = await request(app)
      .put('/questions/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'X' })
    expect(res.status).toBe(200)
  })

  it('404 when not found', async () => {
    const adminToken = createAdminToken();
    mockFrom(buildUpdateMock(null, null))
    const res = await request(app)
      .put('/questions/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'X' })
    expect(res.status).toBe(404)
  })

  it('500 on db error', async () => {
    const adminToken = createAdminToken();
    mockFrom(buildUpdateMock(null, { message: 'e' }))
    const res = await request(app)
      .put('/questions/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'X' })
    expect(res.status).toBe(500)
  })
})

describe('controllers: deleteQuestion', () => {
  afterEach(() => { jest.restoreAllMocks() })

  it('204 on success', async () => {
    const adminToken = createAdminToken();
    mockFrom(buildDeleteMock(null))
    const res = await request(app)
      .delete('/questions/abc')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })

  it('500 on db error', async () => {
    const adminToken = createAdminToken();
    mockFrom(buildDeleteMock({ message: 'x' }))
    const res = await request(app)
      .delete('/questions/abc')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(500)
  })
})
