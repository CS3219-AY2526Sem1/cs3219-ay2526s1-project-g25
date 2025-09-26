// src/server.js
import 'dotenv/config';
import express from 'express';
import matchRouter from './routes/match.js';
import { MatchQueue } from './services/matchQueue.js';
import { initController } from './controllers/matchController.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Instantiate queue with env-configured timings
const queue = new MatchQueue({
  matchTimeoutMs: Number(process.env.MATCH_TIMEOUT_MS || 120000),
  queueRecalcMs: Number(process.env.QUEUE_RECALC_MS || 5000),
  handshakeTtlMs: Number(process.env.HANDSHAKE_TTL_MS || 15000)
});
initController(queue);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/match', matchRouter);

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`Matching service listening on port ${port}`);
});