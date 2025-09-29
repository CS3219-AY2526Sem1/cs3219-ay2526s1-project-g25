
import request from 'supertest';
import { createServer } from 'http';
import app from '../../app.js';

describe('sessions REST', () => {
  test('create + get roundtrip', async () => {
    const server = createServer(app);

    const create = await request(server)
      .post('/sessions')
      .send({ userA: 'alice', userB: 'bob', topic: 'arrays', difficulty: 'easy', questionId: 'q1' })
      .expect(201);

    const id = create.body.id;

    await request(server)
      .post(`/sessions/${id}/join`)
      .send({ userId: 'alice' })
      .expect(200);

    const get = await request(server).get(`/sessions/${id}`).expect(200);
    expect(get.body.session.id).toBe(id);
    expect(get.body.document.version).toBe(0);
    expect(get.body.presence.length).toBe(1);
  });
});
