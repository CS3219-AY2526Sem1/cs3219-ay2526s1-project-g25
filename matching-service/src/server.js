// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from "cors";
import matchRouter from './routes/match.js';
import { MatchQueue } from './services/matchQueue.js';
import { initController } from './controllers/matchController.js';
import { redisClient } from './services/redisClient.js'; // Already connects itself

const app = express();

// --- CORS setup ---
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000", "http://localhost:4002"],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

async function startServer() {
  try {
    // No need to reconnect here
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
