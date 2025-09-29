
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import app from './app.js';
import { initGateway } from './ws/gateway.js';

dotenv.config();
const port = Number(process.env.PORT || 3004);
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
initGateway(wss);

server.listen(port, () => {
  console.log(`collaboration-service listening on http://localhost:${port}`);
  console.log(`WebSocket at ws://localhost:${port}/ws?sessionId=...&userId=...`);
});
