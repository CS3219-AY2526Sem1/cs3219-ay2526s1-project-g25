
import express from 'express';
import cors from 'cors';
import routes from './routes/collaboration.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/', routes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

export default app;
