// src/controllers/matchController.js
let queueRef = null; // injected from server

export function initController(matchQueue) {
  queueRef = matchQueue;
}

/**
 * POST /match/join
 * Body: { userId, topics:[string], difficulty:string }
 */
export async function joinQueue(req, res) {
  try {
    const { userId, topics, difficulty } = req.body;
    if (!userId || !topics || !difficulty) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await queueRef.join({
      userId,
      selectedTopics: topics,
      selectedDifficulty: difficulty,
    });

    return res.json(result);
  } catch (err) {
    console.error("[joinQueue] Error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
}

/**
 * POST /match/leave
 * Body: { userId }
 */
export async function leaveQueue(req, res) {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ error: "Missing userId in request" });

    const result = await queueRef.leave(userId);
    return res.json(result);
  } catch (err) {
    console.error("[leaveQueue] Error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
}

/**
 * GET /match/status/:userId
 */
export async function getStatus(req, res) {
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ error: "Missing userId parameter" });

    const result = await queueRef.getStatus(userId);
    if (result.status === "NOT_FOUND") return res.status(404).json(result);
    return res.json(result);
  } catch (err) {
    console.error("[getStatus] Error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
}

/**
 * POST /match/disconnect
 * Body: { matchId, remainingUserId, action }
 * action ∈ { "solo", "requeue" }
 */
export async function handleDisconnect(req, res) {
  try {
    const { matchId, remainingUserId, action } = req.body;
    if (!matchId || !remainingUserId || !action)
      return res.status(400).json({ error: "Missing required fields" });

    const result = await queueRef.handleDisconnect({
      matchId,
      remainingUserId,
      action,
    });

    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error("[handleDisconnect] Error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
}
