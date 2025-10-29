
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import 'dotenv/config';
import app from './app.js';
import { initGateway } from './ws/gateway.js';
import { connectRedis } from "./services/redisClient.js";
import { initYjsGateway } from './ws/yjsGateway.js';


dotenv.config();
const port = Number(process.env.PORT || 3004);
const server = createServer(app);

const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false }); // /ws
initGateway(wss);

const yws = new WebSocketServer({ noServer: true, perMessageDeflate: false }); // /ws-yjs
initYjsGateway(yws);

server.on('upgrade', (req, socket, head) => {
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    console.log('[upgrade] ->', pathname);

    if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
      return;
    }
    if (pathname === '/ws-yjs') {
      yws.handleUpgrade(req, socket, head, (ws) => yws.emit('connection', ws, req));
      return;
    }
    socket.destroy(); // unknown path
  } catch {
    socket.destroy();
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Connect to Redis before starting server
connectRedis().then(() => {
  server.listen(port, () => {
    console.log(`collaboration-service listening on http://localhost:${port}`);
    console.log(`Custom WS : ws://localhost:${port}/ws?sessionId=...&userId=...`);
    console.log(`Yjs WS    : ws://localhost:${port}/ws-yjs?sessionId=...&userId=...`);
  });
}).catch(err => {
  console.error('Failed to connect to Redis:', err);
  process.exit(1);
});

server.on("upgrade", (req) => {
  console.log("[upgrade] ->", req.url);
});
