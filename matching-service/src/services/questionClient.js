// src/services/questionClient.js
import axios from 'axios';

const BASE_URL = process.env.QUESTION_SERVICE_BASE_URL || 'http://localhost:5050';
const TIMEOUT = Number(process.env.QUESTION_SERVICE_TIMEOUT_MS || 2000);

/**
 * Fetch a random question from Question Service, filtered by topic & difficulty.
 * Returns { data } or throws an Error with .response?.status when QS returns 404.
 */
export async function fetchRandomQuestion({ topic, difficulty, authHeader }) {
  const url = `${BASE_URL}/questions/random`;
  const config = {
    timeout: TIMEOUT,
    params: { topic, difficulty },
    headers: {}
  };
  if (process.env.FORWARD_AUTH_HEADER === 'true' && authHeader) {
    config.headers['Authorization'] = authHeader;
  }

  const res = await axios.get(url, config);
  return res.data;
}
