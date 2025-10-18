import axios from "axios";
import { getAccessToken } from "./auth";

const matchBase = process.env.NEXT_PUBLIC_MATCH_BASE_URL;

export const api = axios.create({
  baseURL: matchBase,
  timeout: 10000,
});


api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[API CALL] ${config.baseURL}${config.url} ✅ Token attached`);
  }
  return config;
});
