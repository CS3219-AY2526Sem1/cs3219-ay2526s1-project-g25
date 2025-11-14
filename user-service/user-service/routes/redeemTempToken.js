/*
 * AI-Assisted Notice:
 * Portions of this file were developed with assistance from ChatGPT, an AI language model created by OpenAI.
 * The AI provided suggestions and code snippets based on the prompts given by the author.
 * All AI-generated code was reviewed, tested, and validated by the author.
 */

import express from "express";
import jwt from "jsonwebtoken";
import { redisRepo } from "../src/repos/redisRepo.js";

const router = express.Router();

router.post("/redeem", async (req, res) => {
  try {
    const { tempKey, audience = "collab", sessionId } = req.body;
    if (!tempKey) return res.status(400).json({ error: "Missing tempKey" });

    // one-time read (your repo already deletes after get)
    const userId = await redisRepo.getTempToken(tempKey);
    if (!userId) return res.status(400).json({ error: "Invalid or expired temp key" });

    const payload = { userId, sessionId: sessionId || null, aud: audience };
    const token = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: "10m",
      issuer: "peerprep",
    });

    return res.json({ token });
  } catch (e) {
    console.error("[redeem] error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;