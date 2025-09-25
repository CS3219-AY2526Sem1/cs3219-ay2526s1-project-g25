// src/server.js
import express from 'express';
import 'dotenv/config';
import questionsRouter from './routes/questions.js';


const app = express();
app.use(express.json({ limit: '1mb' }));

app.use('/questions', questionsRouter);

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Question service listening on port ${port}`);
});
