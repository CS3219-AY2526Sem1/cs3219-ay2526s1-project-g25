import { useState, useRef } from "react";
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
    console.log("inside join");
    if (!userId) {
      console.error("No user ID found, cannot join match queue.");
      return;
    }

    setPhase("searching");
    console.log("Joining match queue", { userId, topics, difficulty });

    try {
      const { data } = await api.post("/match/join", {
        userId,
        topics,
        difficulty,
      });
      console.log("join result:", data);

      if (data.status === "queued") {
        const expiresAt = data.expiresAt; // ⏳ backend sets enqueueAt + matchTimeoutMs
        const remainingMs = expiresAt - Date.now();
        setTimeLeft(Math.floor(remainingMs / 1000));

        // Poll status every 2 s
        pollRef.current = setInterval(async () => {
          try {
            const { data: s } = await api.get(`/match/status/${userId}`);
            if (s.status === "MATCHED") {
              clearInterval(pollRef.current!);
              clearTimeout(timeoutRef.current!);
              setMatchData(s.match);
              setPhase("matched");
            }
          } catch (e) {
            console.warn("Polling error:", e);
          }
        }, 2000);

            const countdown = setInterval(() => {
            setTimeLeft((prev) => {
            if (prev === null || prev <= 1) {
                clearInterval(countdown);
                return 0;
            }
            return prev - 1;
            });
        }, 1000);

        // After 2 min (120 000 ms) → timeout
        timeoutRef.current = setTimeout(() => {
          clearInterval(pollRef.current!);
          setPhase("timeout");
        }, remainingMs || 120000);
      } else if (data.status === "matched") {
        setMatchData(data.match);
        setPhase("matched");
      }
    } catch (e) {
      console.error("Join request failed:", e);
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
