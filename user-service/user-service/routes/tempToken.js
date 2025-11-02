// routes/tempToken.js
import express from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { redisRepo } from "../src/repos/redisRepo.js";

const router = express.Router();
const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || "dev_access_secret";

// 🔹 POST /auth/temp-token
router.post("/temp-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, ACCESS_SECRET);
    const tempKey = randomUUID();

    await redisRepo.setTempToken(tempKey, payload.userId, 60); // 60 sec expiry

    res.json({ tempKey });
  } catch (err) {
    console.error("Error creating temp token:", err);
    res.status(401).json({ message: "Invalid or expired JWT" });
  }
});

// 🔹 POST /auth/resolve-temp
router.post("/resolve-temp", async (req, res) => {
  try {
    const { tempKey } = req.body;
    if (!tempKey) return res.status(400).json({ message: "tempKey required" });

    const userId = await redisRepo.getTempToken(tempKey);
    if (!userId)
      return res.status(401).json({ message: "Invalid or expired temp key" });

    const newJwt = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "1h" });
    res.json({ accessToken: newJwt });
  } catch (err) {
    console.error("Error resolving temp token:", err);
    res.status(500).json({ message: "Internal error" });
  }
});

export default router;
