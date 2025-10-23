import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

export function useMatchFlow(userId: string | null) {
  
  const [phase, setPhase] = useState<
    "idle" | "searching" | "matched" | "timeout" | "error"
  >("idle");
  const [matchData, setMatchData] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const join = async (topics: string[], difficulty: string) => {
    console.log("[useMatchFlow] inside join()");
    if (!userId) {
      console.error("No user ID found, cannot join match queue.");
      return;
    }

    setPhase("searching");
    console.log("[useMatchFlow] Joining match queue", { userId, topics, difficulty });

    try {
      const { data } = await api.post("/match/join", {
        userId,
        topics,
        difficulty: difficulty.toLowerCase(),
      });
      console.log("[useMatchFlow] join result:", data);

      // Helper function for polling the backend until match is ready with sessionId
      const startPolling = () => {
        let attempts = 0;
        pollRef.current = setInterval(async () => {
          attempts++;
          try {
            const { data: s } = await api.get(`/match/status/${userId}`);
            // ✅ Only move to "matched" when sessionId is guaranteed to exist
            if (s.status === "MATCHED" && s.match?.sessionId) {
              clearInterval(pollRef.current!);
              clearTimeout(timeoutRef.current!);
              setMatchData(s.match);
              setPhase("matched");
              console.log("[useMatchFlow] ✅ Match confirmed:", s.match);
            }
          } catch (e) {
            console.warn("[useMatchFlow] Polling error:", e);
          }
        }, 2000);
      };

      // Queue flow: set timers and begin polling
      if (data.status === "queued") {
        const expiresAt = data.expiresAt;
        
        // Only calculate time on client side to avoid hydration mismatch
        if (typeof window !== 'undefined') {
          const remainingMs = expiresAt - Date.now();
          setTimeLeft(Math.floor(remainingMs / 1000));
          
          // Countdown timer for UI
          const countdown = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(countdown);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          // Timeout after queue duration
          timeoutRef.current = setTimeout(() => {
            clearInterval(pollRef.current!);
            setPhase("timeout");
            console.log("[useMatchFlow] Queue timed out");
          }, remainingMs || 120000);
        }
        
        startPolling();
      }

      // Immediate match (edge case)
      else if (data.status === "matched") {
        if (!data.match.sessionId) {
          console.log("[useMatchFlow] Session not ready yet, starting short polling...");
          startPolling(); // ensure it fetches complete data
        } else {
          setMatchData(data.match);
          setPhase("matched");
        }
      }
    } catch (e) {
      console.error("[useMatchFlow] Join request failed:", e);
      setPhase("error");
    }
  };

  const leave = async () => {
    if (!userId) return;
    await api.post("/match/leave", { userId });
    setPhase("idle");
    clearInterval(pollRef.current!);
    clearTimeout(timeoutRef.current!);
  };

  return { phase, matchData, join, leave, timeLeft };
}
