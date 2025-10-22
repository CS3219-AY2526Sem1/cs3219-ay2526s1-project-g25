// Utility: extract params from URL (sessionId, userId)
function getParams() {
  if (typeof window === "undefined") return { sessionId: "", userId: "" };
  const url = new URL(window.location.href);
  return {
    sessionId: url.searchParams.get("sessionId") || "demo-session",
    userId:
      url.searchParams.get("userId") ||
      "guest-" + Math.random().toString(36).slice(2, 7),
  };
}

export { getParams };
