function readCollabToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("collabToken") || "";
}

function decodeJwtPayload(token: string): any | null {
  try {
    // handle base64url
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getUserIdFromToken(): string | null {
  const t = readCollabToken();
  if (!t) return null;
  const payload = decodeJwtPayload(t);
  if (!payload || payload.userId == null) return "USER_ID_NOT_FOUND";
  return String(payload.userId);
}

export { readCollabToken, decodeJwtPayload, getUserIdFromToken };