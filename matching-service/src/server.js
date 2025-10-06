// src/server.js
import 'dotenv/config';
import express from 'express';
import matchRouter from './routes/match.js';
import { MatchQueue } from './services/matchQueue.js';
import { initController } from './controllers/matchController.js';
import { redisClient } from './services/redisClient.js'; // ✅ NEW import

const app = express();
app.use(express.json({ limit: '1mb' }));

// ✅ Ensure Redis connects before starting the service
async function startServer() {
  try {
    await redisClient.connect();
    console.log('[Redis] Connected successfully');

    // Instantiate queue with Redis-backed implementation
    const queue = new MatchQueue({
      matchTimeoutMs: Number(process.env.MATCH_TIMEOUT_MS || 120000),
      queueRecalcMs: Number(process.env.QUEUE_RECALC_MS || 5000),
      handshakeTtlMs: Number(process.env.HANDSHAKE_TTL_MS || 15000),
      fallbackThresholdMs: Number(process.env.FALLBACK_THRESHOLD_MS || 60000),
    });

    initController(queue);

    // Health route
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    // Routes
    app.use('/match', matchRouter);

    const port = process.env.PORT || 4001;
    const server = app.listen(port, () => {
      console.log(`Matching service listening on port ${port}`);
    });

    // Graceful shutdown for Redis and HTTP server
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
