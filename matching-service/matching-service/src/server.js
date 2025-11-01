// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from "cors";
import matchRouter from './routes/match.js';
import { MatchQueue } from './services/matchQueue.js';
import { initController } from './controllers/matchController.js';
import { redisClient, connectRedis } from './services/redisClient.js';

const app = express();

// --- CORS setup ---
const allowedOrigins = [
  "https://peerprep-login-signup.vercel.app",  // Login UI
  "https://peerprep-matching.vercel.app",  // Matching UI
  "https://peerprep-collab.vercel.app",  // Collaboration UI
  "http://localhost:3000",  // Login UI
  "http://localhost:3002",  // Matching UI
  "http://localhost:4000",  // Collaboration UI
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:4000"
];

// Add environment origins if provided
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(','));
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '1mb' }));

async function startServer() {
  try {
    // Connect to Redis first
    await connectRedis();
    
    const queue = new MatchQueue({
      matchTimeoutMs: Number(process.env.MATCH_TIMEOUT_MS || 120000),
      queueRecalcMs: Number(process.env.QUEUE_RECALC_MS || 5000),
      handshakeTtlMs: Number(process.env.HANDSHAKE_TTL_MS || 15000),
      fallbackThresholdMs: Number(process.env.FALLBACK_THRESHOLD_MS || 60000),
    });

    initController(queue);

    app.get('/health', (req, res) => res.json({ status: 'ok' }));
    app.use('/match', matchRouter);

    const port = process.env.PORT || 4001;
    const server = app.listen(port, () => {
      console.log(`Matching service listening on port ${port}`);
    });

    process.on('SIGINT', async () => {
      console.log('\n[Server] Shutting down...');
      await redisClient.quit();
      server.close(() => {
        console.log('[Server] Closed gracefully.');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('[Startup Error]', err);
    process.exit(1);
  }
}

startServer();
