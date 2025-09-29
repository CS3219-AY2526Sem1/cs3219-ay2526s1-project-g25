
import { z } from 'zod';
import { createSession as makeSession } from '../services/sessionService.js';
import { documents, presence, runLogs, sessionLocks, sessions } from '../repos/memoryRepo.js';
import { getOrCreateDoc } from '../services/documentService.js';
import { runOnce } from '../services/executionService.js';

const createSessionSchema = z.object({
  userA: z.string().min(1),
  userB: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
  questionId: z.string().min(1)
});

export const createSession = (req, res) => {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const s = makeSession(parsed.data);
  sessions.set(s.id, s);
  presence.set(s.id, new Map());
  documents.set(s.id, { version: 0, text: '' });
  runLogs.set(s.id, []);
  res.status(201).json(s);
};

export const getSession = (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const doc = getOrCreateDoc(documents, s.id);
  const pres = Array.from((presence.get(s.id) ?? new Map()).entries()).map(([userId, p]) => ({ userId, ...p }));
  const runs = runLogs.get(s.id) ?? [];
  res.json({ session: s, document: doc, presence: pres, runs });
};

export const joinSession = (req, res) => {
  const s = sessions.get(req.params.id);
  const userId = String(req.body?.userId || '');
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (userId !== s.userA && userId !== s.userB) return res.status(403).json({ error: 'User not in this session' });
  const p = presence.get(s.id) ?? new Map();
  p.set(userId, { cursor: null, lastSeen: Date.now() });
  presence.set(s.id, p);
  res.json({ ok: true });
};

export const leaveSession = (req, res) => {
  const s = sessions.get(req.params.id);
  const userId = String(req.body?.userId || '');
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const p = presence.get(s.id) ?? new Map();
  p.delete(userId);
  presence.set(s.id, p);
  if (p.size === 0) s.status = 'ended';
  res.json({ ok: true, status: s.status });
};

const executeSchema = z.object({ code: z.string().default(''), language: z.string().default('plaintext') });

export const execute = async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const parsed = executeSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { busy, run } = await runOnce(s.id, sessionLocks, runLogs, parsed.data.code, parsed.data.language);
  if (busy) return res.status(429).json({ error: 'Execution in progress' });
  res.status(201).json(run);
};
