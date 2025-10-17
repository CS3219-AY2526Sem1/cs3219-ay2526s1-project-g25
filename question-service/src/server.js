// src/server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import questionsRouter from './routes/questions.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/questions', questionsRouter);

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Only start the HTTP server when not running tests
const port = process.env.PORT || 5050;

process.on("uncaughtException", err => {
  console.error("[FATAL] Uncaught exception:", err);
});

process.on("unhandledRejection", err => {
  console.error("[FATAL] Unhandled rejection:", err);
});
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Question service listening on port ${port}`);
  });
}

export default app;