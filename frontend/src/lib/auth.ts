// src/lib/auth.ts
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  
  // TEMP: fallback token for local testing
  const devToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMiwiaWF0IjoxNzU5OTE0MDcwLCJleHAiOjE3NjA1MTg4NzB9.hK9kRv6JjMRU3561nMF9eIMhIe4oU_5rCXvu0SG6PQg"
  const token = localStorage.getItem("accessToken") || devToken;
  return token;
}

// simple and browser-safe JWT decode
export function parseJwt<T = any>(token: string): T | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}
