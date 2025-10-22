import { validateCreateQuestion, validateUpdateQuestion } from '../middleware/validateQuestion.js'
import express from 'express'
import request from 'supertest'

function makeApp(handler) {
  const app = express()
  app.use(express.json())
  app.post('/test', handler, (req, res) => res.json({ ok: true, body: req.body }))
  return app
}

describe('validateCreateQuestion', () => {
  it('400 when required fields missing or invalid', async () => {
    const app = makeApp(validateCreateQuestion)
    const res = await request(app).post('/test').send({ title: '' })
    expect(res.status).toBe(400)
    expect(res.body.fields).toBeDefined()
  })

  it('accepts test_cases as object', async () => {
    const app = makeApp(validateCreateQuestion)
    const payload = { title: 'T', description: 'D', difficulty: 'easy', topic: 'Math', test_cases: { a: 1 } }
    const res = await request(app).post('/test').send(payload)
    expect(res.status).toBe(200)
    expect(res.body.body.test_cases).toEqual({ a: 1 })
  })

  it('parses test_cases JSON string', async () => {
    const app = makeApp(validateCreateQuestion)
    const payload = { title: 'T', description: 'D', difficulty: 'easy', topic: 'Math', test_cases: '{"a":2}' }
    const res = await request(app).post('/test').send(payload)
    expect(res.status).toBe(200)
    expect(res.body.body.test_cases).toEqual({ a: 2 })
  })

  it('400 when test_cases invalid JSON', async () => {
    const app = makeApp(validateCreateQuestion)
    const payload = { title: 'T', description: 'D', difficulty: 'easy', topic: 'Math', test_cases: '{bad' }
    const res = await request(app).post('/test').send(payload)
    expect(res.status).toBe(400)
  })

  it('400 when invalid difficulty', async () => {
    const app = makeApp(validateCreateQuestion)
    const payload = { title: 'T', description: 'D', difficulty: 'invalid', topic: 'Math', test_cases: {} }
    const res = await request(app).post('/test').send(payload)
    expect(res.status).toBe(400)
  })
})

describe('validateUpdateQuestion', () => {
  function makeUpdateApp() {
    const app = express()
    app.use(express.json())
    app.put('/test', validateUpdateQuestion, (req, res) => res.json({ ok: true, body: req.body }))
    return app
  }

  it('400 when no updatable fields provided', async () => {
    const app = makeUpdateApp()
    const res = await request(app).put('/test').send({})
    expect(res.status).toBe(400)
  })

  it('400 when invalid difficulty', async () => {
    const app = makeUpdateApp()
    const res = await request(app).put('/test').send({ difficulty: 'bad' })
    expect(res.status).toBe(400)
  })

  it('parses test_cases JSON string', async () => {
    const app = makeUpdateApp()
    const res = await request(app).put('/test').send({ test_cases: '{"x":1}', title: 'ok' })
    expect(res.status).toBe(200)
    expect(res.body.body.test_cases).toEqual({ x: 1 })
  })

  it('400 when test_cases invalid JSON', async () => {
    const app = makeUpdateApp()
    const res = await request(app).put('/test').send({ test_cases: '{bad}', title: 'ok' })
    expect(res.status).toBe(400)
  })

  it('accepts partial valid updates', async () => {
    const app = makeUpdateApp()
    const res = await request(app).put('/test').send({ title: 'New' })
    expect(res.status).toBe(200)
  })
})
