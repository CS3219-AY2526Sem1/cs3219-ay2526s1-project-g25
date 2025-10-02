
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

describe("REST and Websocket", () => {
    let server;
    let baseURL;

    beforeAll((done) => {
        server = createServer(app);
        server.listen(0, () => {
            const { port } = server.address();
            baseURL = `http://localhost:${port}`;
            done();
        })
    })

    afterAll((done) => {
        server.close(done);
    })

    test("pairs two users and syncs updates", async () => {
        const sessionCreate = await request(baseURL)
            .post('/sessions')
            .send({ userA: 'alice', userB: 'bob', topic: 'arrays', difficulty: 'hard', questionId: '123' })
            .expect(201);
        const sessionId = sessionCreate.body.id;
        expect(sessionId).toBeDefined();

        const sessionExists = await request(baseURL)
            .get(`/sessions/${sessionId}`)
            .send({ id: sessionId })
            .expect(200);
        expect(sessionExists.body).toBeDefined();

        const userA = await request(baseURL)
            .post(`/sessions/${sessionId}/join`)
            .send({ userId: 'alice' })
            .expect(200);

        const userB = await request(baseURL)
            .post(`/sessions/${sessionId}/join`)
            .send({ userId: 'bob' })
            .expect(200);
    })
})
