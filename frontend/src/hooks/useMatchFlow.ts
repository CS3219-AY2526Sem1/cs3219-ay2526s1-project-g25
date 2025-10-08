import { useState, useRef } from "react";
import { api } from "@/lib/api";

export function useMatchFlow(userId: string | null) {
  const [phase, setPhase] = useState<"idle" | "searching" | "matched" | "timeout" | "error">("idle");
  const [matchData, setMatchData] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const join = async (topics: string[], difficulty: string) => {
    console.log("inside join");
    if (!userId) {
      console.error("No user ID found, cannot join match queue.");
      return;
    }
    setPhase("searching");
    console.log("Joining match queue", { userId, topics, difficulty });

    const { data } = await api.post("/match/join", { userId, topics, difficulty });
    console.log(data);

    if (data.status === "queued") {
      pollRef.current = setInterval(async () => {
        const { data: s } = await api.get(`/match/status/${userId}`);
        if (s.status === "MATCHED") {
          setMatchData(s.match);
          setPhase("matched");
          clearInterval(pollRef.current!);
        }
      }, 2000);
    } else if (data.status === "matched") {
      setMatchData(data.match);
      setPhase("matched");
    }
  };

  const leave = async () => {
    if (!userId) return;
    await api.post("/match/leave", { userId });
    setPhase("idle");
    clearInterval(pollRef.current!);
  };

  return { phase, matchData, join, leave };
}
