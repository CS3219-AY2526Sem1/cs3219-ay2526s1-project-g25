// ---- config helpers ----
function getUserSvcBase() {
  return process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001";
}

function scrubParams(params: string[]) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  params.forEach(p => url.searchParams.delete(p));
  window.history.replaceState({}, "", url.toString());
}

// ---- legacy: keep supporting ?token= for now ----
export function syncTokenFromQuery(): void {
  if (typeof window === "undefined") return;
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  if (token) {
    localStorage.setItem("accessToken", token); // legacy storage
    scrubParams(["token"]);
  }
}

// ---- new: redeem ?temp=<tempKey> via User Service ----
export async function redeemTempFromQuery(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const temp = urlParams.get("temp");
  if (!temp) return null;

  const res = await fetch(`${getUserSvcBase()}/auth/resolve-temp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tempKey: temp }),
  });

  if (!res.ok) throw new Error("redeem failed");

  const { token } = await res.json();

  // Prefer session-scoped storage for short-lived collab tokens
  sessionStorage.setItem("collabToken", token);
  scrubParams(["temp"]);

  return token;
}

// ---- token getters ----
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1) try the new collab token first
  const collab = sessionStorage.getItem("collabToken");
  if (collab) return collab;

  // 2) legacy behavior (kept for backward compatibility)
  syncTokenFromQuery();
  const legacy = localStorage.getItem("accessToken");
  if (legacy) return legacy;

  // 3) final attempt: if someone still injected ?token= in URL
  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) {
    localStorage.setItem("accessToken", urlToken);
    scrubParams(["token"]);
    return urlToken;
  }

  return null;
}

// Simple and browser-safe JWT decode (unchanged)
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

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function logout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("collabToken");
  localStorage.removeItem("accessToken"); // legacy
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}
