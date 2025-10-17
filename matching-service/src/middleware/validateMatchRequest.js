const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

export function validateJoin(req, res, next) {
  const { userId, topics, difficulty } = req.body;
  const errors = [];

  if (!userId || typeof userId !== 'string') errors.push('userId (string) is required');
  if (!Array.isArray(topics) || topics.length < 1 || topics.length > 5) {
    errors.push('topics must be a non-empty array with at most 5 values');
  }
  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
    errors.push('difficulty must be one of: easy, medium, hard');
  }

  if (errors.length) return res.status(400).json({ error: 'Invalid request', details: errors });
  next();
}

export function validateLeave(req, res, next) {
  const { userId } = req.body;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId (string) is required' });
  }
  next();
}