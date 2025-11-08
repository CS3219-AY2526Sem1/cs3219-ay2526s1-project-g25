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

// import express from "express";
// import jwt from "jsonwebtoken";
// import Redis from "ioredis";

// const router = express.Router();
// const redis = new Redis(process.env.REDIS_URL);

// // POST /auth/redeem
// router.post("/redeem", async (req, res) => {
//   try {
//     const { tempKey, audience = "matching", sessionId, userId } = req.body;
//     if (!tempKey) return res.status(400).json({ error: "Missing tempKey" });

//     // --- 1️⃣ Retrieve & delete key atomically ---
//     const data = await redis.getdel(`temp:${tempKey}`);
//     if (!data)
//       return res.status(400).json({ error: "Temp key invalid or already used" });

//     const parsed = JSON.parse(data);
//     if (!parsed.userId)
//       return res.status(400).json({ error: "Corrupted temp key data" });

//     // --- 2️⃣ Verify audience (defensive) ---
//     if (parsed.audience && parsed.audience !== audience)
//       return res.status(403).json({ error: "Audience mismatch" });

//     // --- 3️⃣ Mint short-lived JWT ---
//     const payload = {
//       userId: parsed.userId,
//       sessionId: sessionId || parsed.sessionId || null,
//       aud: audience,
//     };

//     const token = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
//       expiresIn: "10m",
//       issuer: "peerprep",
//     });

//     return res.json({ token });
//   } catch (err) {
//     console.error("[redeem] Error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// export default router;
