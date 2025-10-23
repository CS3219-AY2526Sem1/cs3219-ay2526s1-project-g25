// src/lib/auth.ts
export function syncTokenFromQuery(): void {
  if (typeof window === "undefined") return;
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  if (token) {
    localStorage.setItem("accessToken", token);
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  // If token was sent via query but not saved yet, sync it first
  syncTokenFromQuery();

  const token = localStorage.getItem("accessToken");
  
  // If no token in localStorage, try to get from URL params
  if (!token) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      localStorage.setItem("accessToken", urlToken);
      return urlToken;
    }
  }
  
  return token || null;
}

// Simple and browser-safe JWT decode
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
