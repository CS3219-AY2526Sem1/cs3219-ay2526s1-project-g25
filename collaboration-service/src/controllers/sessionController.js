import { z } from "zod";
import { createSession as makeSession } from "../services/sessionService.js";
import { redisRepo } from "../repos/redisRepo.js";
import { runOnce } from "../services/executionService.js";

/**
 * Validation schema for session creation
 */
const createSessionSchema = z.object({
  userA: z.string().min(1),
  userB: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
  questionId: z.string().min(1),
});

/**
 * Create a new session and store in Redis
 */
export const createSession = async (req, res) => {
  try {
    console.log("Received body:", req.body);
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.issues);
      return res.status(400).json({ error: parsed.error.issues });
    }

    // `makeSession` already writes everything to Redis
    const s = await makeSession(parsed.data);
    console.log("Created session:", s);

    return res.status(201).json(s);
  } catch (e) {
    console.error("[createSession] Error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Retrieve an existing session
 */
export const getSession = async (req, res) => {
  try {
    const s = await redisRepo.getJson(`collab:session:${req.params.id}`);
    if (!s) return res.status(404).json({ error: "Not found" });

    const doc = (await redisRepo.getJson(`collab:document:${s.id}`)) || {
      version: 0,
      text: "",
    };
    const pres = (await redisRepo.getJson(`collab:presence:${s.id}`)) || {};
    const runs = (await redisRepo.getList(`collab:runLogs:${s.id}`)) || [];

    return res.json({ session: s, document: doc, presence: pres, runs });
  } catch (e) {
    console.error("[getSession] Error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Join a session
 */
export const joinSession = async (req, res) => {
  try {
    const s = await redisRepo.getJson(`collab:session:${req.params.id}`);
    if (!s) return res.status(404).json({ error: "Not found" });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const pres = (await redisRepo.getJson(`collab:presence:${s.id}`)) || {};
    pres[userId] = { cursor: null, lastSeen: Date.now() };
    await redisRepo.setJson(`collab:presence:${s.id}`, pres);

    return res.json({ ok: true });
  } catch (e) {
    console.error("[joinSession] Error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Leave a session
 */
export const leaveSession = async (req, res) => {
  try {
    const s = await redisRepo.getJson(`collab:session:${req.params.id}`);
    if (!s) return res.status(404).json({ error: "Not found" });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const pres = (await redisRepo.getJson(`collab:presence:${s.id}`)) || {};
    delete pres[userId];
    await redisRepo.setJson(`collab:presence:${s.id}`, pres);

    if (Object.keys(pres).length === 0) {
      s.status = "ended";
      await redisRepo.setJson(`collab:session:${s.id}`, s);
    }

    return res.json({ ok: true, status: s.status });
  } catch (e) {
    console.error("[leaveSession] Error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Execute code snippet
 */
const executeSchema = z.object({
  code: z.string().default(""),
  language: z.string().default("plaintext"),
});

export const execute = async (req, res) => {
  try {
    const s = await redisRepo.getJson(`collab:session:${req.params.id}`);
    if (!s) return res.status(404).json({ error: "Not found" });

    const parsed = executeSchema.safeParse(req.body || {});
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues });

    const logKey = `runLogs:${s.id}`;
    const prevLogs = (await redisRepo.getList(logKey)) || [];

    const { busy, run } = await runOnce(
      s.id,
      new Map(),
      new Map([[s.id, prevLogs]]),
      parsed.data.code,
      parsed.data.language
    );

    if (busy) return res.status(429).json({ error: "Execution in progress" });
    await redisRepo.pushToList(logKey, run);

    return res.status(201).json(run);
  } catch (e) {
    console.error("[execute] Error:", e);
    return res.status(500).json({ error: e.message });
  }
};
