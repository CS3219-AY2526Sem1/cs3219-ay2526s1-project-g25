"use client";
import MatchCanvas from "@/components/match/MatchCanvas";
import MatchStatusCard from "@/components/match/MatchStatusCard";
import { useMatchFlow } from "@/hooks/useMatchFlow";
import { getAccessToken, parseJwt } from "@/lib/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import TopicSelector from "@/components/match/TopicSelector";

export default function MatchPage() {
  const token = getAccessToken();
  const payload = token ? parseJwt<{ userId: number }>(token) : null;
  const userId = payload?.userId ? String(payload.userId) : null;
  const { phase, matchData, join, leave, timeLeft} = useMatchFlow(userId);
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("easy");

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center text-white">
      <MatchCanvas />
      <motion.div
        className="z-10 p-8 rounded-3xl backdrop-blur-2xl bg-slate-950/50 border border-slate-800/60 shadow-2xl w-[95%] md:w-[720px]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 1 }}
      >
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Intelligent Peer Matching
        </h1>
        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {["easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-xl transition border ${
                  difficulty === d
                    ? "bg-emerald-500 text-black"
                    : "border-slate-700 hover:border-slate-500"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <TopicSelector selected={topics} setSelected={setTopics} />
          <div className="text-center">
            <button
              onClick={() => join(topics, difficulty)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-xl font-medium transition"
            >
              {phase === "searching" ? "Searching…" : "Find Partner"}
            </button>
          </div>
          <MatchStatusCard phase={phase} matchData={matchData} timeLeft={timeLeft} onCancel={leave} />
        </div>
      </motion.div>
    </div>
  );
}
