// src/middleware/validateQuestion.js
export function validateCreateQuestion(req, res, next) {
  const payload = req.body;
  const missing = [];

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim() === '') {
    missing.push('title');
  }
  if (!payload.description || typeof payload.description !== 'string' || payload.description.trim() === '') {
    missing.push('description');
  }
  if (!payload.difficulty || !['easy','medium','hard'].includes(payload.difficulty)) {
    missing.push('difficulty (must be one of: easy, medium, hard)');
  }
  if (!payload.topic || typeof payload.topic !== 'string' || payload.topic.trim() === '') {
    missing.push('topic');
  }
  if (payload.test_cases === undefined) {
    missing.push('test_cases');
  } else {
    // Accept either JSON object or JSON string that parses to object
    // We'll require that after parsing/normalizing it's an object or array.
    try {
      const tc = typeof payload.test_cases === 'string' ? JSON.parse(payload.test_cases) : payload.test_cases;
      if (typeof tc !== 'object' || tc === null) missing.push('test_cases (must be a JSON object or array)');
      else req.body.test_cases = tc;
    } catch (err) {
      missing.push('test_cases (invalid JSON)');
    }
  }

  if (missing.length) {
    return res.status(400).json({ error: 'Missing or invalid fields', fields: missing });
  }
  next();
}

export function validateUpdateQuestion(req, res, next) {
  // For updates: require that if the field exists, it is non-empty; id must not be changed (enforced elsewhere).
  const payload = req.body;
  const allowedFields = ['title','description','difficulty','topic','test_cases', 'image_url'];

  // If no allowed fields present -> bad request
  const provided = Object.keys(payload).filter(k => allowedFields.includes(k));
  if (provided.length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided. Allowed: title, description, difficulty, topic, test_cases, image_url' });
  }

  // Validate any provided fields
  if (payload.difficulty && !['easy','medium','hard'].includes(payload.difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty: must be one of easy, medium, hard' });
  }
  if (payload.test_cases !== undefined) {
    try {
      const tc = typeof payload.test_cases === 'string' ? JSON.parse(payload.test_cases) : payload.test_cases;
      if (typeof tc !== 'object' || tc === null) return res.status(400).json({ error: 'test_cases must be a JSON object or array' });
      req.body.test_cases = tc;
    } catch (err) {
      return res.status(400).json({ error: 'test_cases invalid JSON' });
    }
  }
  next();
}
