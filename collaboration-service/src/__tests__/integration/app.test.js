import request from 'supertest';
import { createServer } from 'http';
import app from '../../app.js';
import { WebSocket, WebSocketServer } from 'ws';
import { initGateway } from '../../ws/gateway.js';

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
    let wss;

    let baseURL;

    beforeAll((done) => {
        server = createServer(app);
        wss = new WebSocketServer({ server, path: '/ws' });
        initGateway(wss);

        server.listen(0, () => {
            const { port } = server.address();
            baseURL = `http://localhost:${port}`;
            done();
        })

    })

    afterAll((done) => {
        // close any open websocket clients attached.
        wss.clients.forEach((client) => { client.terminate(); });
        wss.close(() => {
            server.close(done);
        });
    });

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

        // Open websockets for both clients
        const wsA = new WebSocket(`${baseURL.replace("http", "ws")}/ws`, {
            headers: {
                "x-session-id": sessionId,
                "x-user-id": "alice"
            }
        });

        await new Promise((resolve) => {
            wsA.on("open", () => {
                resolve(wsA);
            })
        })

        const wsB = new WebSocket(`${baseURL.replace("http", "ws")}/ws`, {
            headers: {
                "x-session-id": sessionId,
                "x-user-id": "bob"
            }
        });

        await new Promise((resolve) => {
            wsB.on("open", () => {
                resolve(wsB);
            })
        })

        const messagesA = [];
        const messagesB = [];

        wsA.on("message", (msg) => {
            messagesA.push(JSON.parse(msg));
        })

        wsB.on("message", (msg) => {
            messagesB.push(JSON.parse(msg));
        })

        // Wait for connection to be established
        wsA.send(JSON.stringify({ type: 'doc:op', op: { type: 'insert', index: 0, text: "Hello!", version: 0 } }));
        await new Promise((r) => setTimeout(r, 200));

        expect(messagesA).toHaveLength(1);
        expect(messagesB).toHaveLength(1);
        expect(messagesA[0].type).toEqual('doc:applied');
        expect(messagesA[0].document.text).toEqual('Hello!');
        expect(messagesA[0].document.version).toEqual(1);
        expect(messagesA[0].by).toEqual('alice');
        expect(messagesB[0].type).toEqual('doc:applied');
        expect(messagesB[0].document.text).toEqual('Hello!');
        expect(messagesB[0].document.version).toEqual(1);
        expect(messagesB[0].by).toEqual('alice');

        wsB.send(JSON.stringify({ type: 'doc:op', op: { type: 'delete', index: 0, length: 6, version: 1 } }));
        await new Promise((r) => setTimeout(r, 200));

        expect(messagesA).toHaveLength(2);
        expect(messagesB).toHaveLength(2);
        expect(messagesA[1].type).toEqual('doc:applied');
        expect(messagesA[1].document.text).toEqual('');
        expect(messagesA[1].document.version).toEqual(2);
        expect(messagesA[1].by).toEqual('bob');
        expect(messagesB[1].type).toEqual('doc:applied');
        expect(messagesB[1].document.text).toEqual('');
        expect(messagesB[1].document.version).toEqual(2);
        expect(messagesB[1].by).toEqual('bob');

        wsA.send(JSON.stringify({ type: 'doc:op', op: { type: 'insert', index: 0, text: "Hello!", version: 0 } }));
        await new Promise((r) => setTimeout(r, 200));

        expect(messagesA).toHaveLength(3);
        expect(messagesA[2].type).toEqual('doc:resync');
        expect(messagesA[2].document.text).toEqual('');

        wsA.send(JSON.stringify({ type: 'doc:op', op: { type: 'insert', index: 0, text: "Hello!", version: 2 } }));
        await new Promise((r) => setTimeout(r, 200));

        wsB.send(JSON.stringify({ type: "cursor:update", cursor: { line: 0, col: 3 } }));
        await new Promise((r) => setTimeout(r, 200));

        expect(messagesA).toHaveLength(5);
        expect(messagesA[4].type).toEqual('cursor:update');
        expect(messagesA[4].userId).toEqual('bob');
        expect(messagesA[4].cursor.line).toEqual(0);
        expect(messagesA[4].cursor.col).toEqual(3);

        wsA.close();
        wsB.close();
    }, 30000)
})
