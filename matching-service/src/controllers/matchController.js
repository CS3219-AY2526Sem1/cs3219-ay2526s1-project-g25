
// src/controllers/matchController.js
let queueRef = null; // injected from server

export function initController(matchQueue) {
  queueRef = matchQueue;
}

export async function joinQueue(req, res) {
  try {
    const { userId, topics, difficulty } = req.body;

    // use queueRef, not queue
    const result = await queueRef.join({
      userId,
      selectedTopics: topics,
      selectedDifficulty: difficulty
    });

    return res.json(result);
  } catch (err) {
    console.error('[joinQueue] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

export function leaveQueue(req, res) {
  try {
    const { userId } = req.body;
    const result = queueRef.leave(userId);
    return res.json(result);
  } catch (err) {
    console.error('[leaveQueue] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

export function getStatus(req, res) {
  try {
    const { userId } = req.params;
    const result = queueRef.getStatus(userId);
    if (result.status === 'NOT_FOUND') return res.status(404).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[getStatus] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

export function handleDisconnect(req, res) {
  try {
    const { matchId, remainingUserId, action } = req.body;
    const result = queueRef.handleDisconnect({ matchId, remainingUserId, action });
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[handleDisconnect] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}