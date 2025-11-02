"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Sparkles } from "lucide-react";
import CodeBackground from "@/components/match/CodeBackground";
import TopicSelector from "@/components/match/TopicSelector";
import MatchStatusCard from "@/components/match/MatchStatusCard";
import MatchCanvas from "@/components/match/MatchCanvas";
import { useMatchFlow } from "@/hooks/useMatchFlow";
import { getAccessToken, parseJwt } from "@/lib/auth";
import PeerPrepLogo from "@/components/match/PeerPrepLogo";

export default function MatchPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);

  const urlParams = new URLSearchParams(window.location.search);
  const tempKey = urlParams.get("temp");
  const userServiceUrl =
    process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001";

  const handleAuth = async () => {
    try {
      if (tempKey) {
        console.log("[MatchPage] Found temp key in URL, redeeming...");
        const res = await fetch(`${userServiceUrl}/auth/resolve-temp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempKey }),
        });

        if (!res.ok) {
          console.error("[MatchPage] Failed to redeem temp key");
          alert("Session expired or invalid. Please rejoin from Dashboard.");
          return;
        }

        const { accessToken } = await res.json();
        if (!accessToken) {
          console.error("[MatchPage] No accessToken in response");
          alert("Unable to authenticate session.");
          return;
        }

        // ✅ Store the new access token
        localStorage.setItem("accessToken", accessToken);

        const payload = parseJwt<{ userId: number }>(accessToken);
        if (payload?.userId) {
          setUserId(String(payload.userId));
          console.log("[MatchPage] User authenticated:", payload);
        } else {
          console.warn("[MatchPage] Invalid payload, using fallback user");
          setUserId("123");
        }
      } else {
        // No temp key → use existing token
        const token = getAccessToken();
        console.log(
          "[MatchPage] Token found:",
          token ? token.substring(0, 20) + "..." : "None"
        );

        if (token) {
          const payload = parseJwt<{ userId: number }>(token);
          setUserId(payload?.userId ? String(payload.userId) : null);
        } else {
          console.log("[MatchPage] No token found, using demo user");
          setUserId("123");
        }
      }
    } catch (err) {
      console.error("[MatchPage] Auth flow error:", err);
      alert("Error authenticating. Please rejoin from Dashboard.");
    }
  };

  handleAuth();
}, []);


  const { phase, matchData, join, leave, timeLeft } = useMatchFlow(userId);
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("EASY");

  const handleFindMatch = () => {
    if (topics.length === 0) {
      alert("Please select at least one topic");
      return;
    }
    join(topics, difficulty);
  };

  const isMatchingActive = phase === "searching" || phase === "matched";

  if (!isClient) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <div className="text-purple-300 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <MatchCanvas />
      <CodeBackground />

      {/* Header */}
      <motion.div
        className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          {/* Return to Dashboard Button */}
          <button
            onClick={() =>
              (window.location.href =
                process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard")
            }
            className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-500/30 bg-purple-900/30 
                       hover:bg-purple-800/50 hover:border-purple-400/50 text-purple-300 font-medium text-sm 
                       transition-all duration-300 shadow-sm hover:shadow-purple-500/30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="tracking-wide">Return to Dashboard</span>
          </button>

          {/* Unified App Logo */}
          <PeerPrepLogo size="xl" />
        </div>

        {isClient && userId && (
          <div className="text-purple-300 text-sm font-medium bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/30">
            User: {userId}
          </div>
        )}
      </motion.div>

      {/*FIXED: close the header div properly before continuing */}
      <AnimatePresence mode="wait">
        {!isMatchingActive ? (
          <motion.div
            key="selection"
            className="z-10 flex items-center justify-center min-h-screen px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <div className="w-full max-w-3xl">
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-900/30 p-8 md:p-10 border border-purple-500/20">
                {/* Title Section */}
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center justify-center gap-2 mb-4"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                  >
                    <Target className="w-10 h-10 text-purple-400" />
                  </motion.div>

                  <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent">
                    Find Your Match
                  </h2>
                  <p className="text-slate-400 text-lg tracking-wide uppercase font-medium flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Practice. Match. Excel.
                    <Sparkles className="w-4 h-4" />
                  </p>
                </div>

                {/* Difficulty Selection */}
                <div className="mb-8">
                  <label className="block text-purple-300 font-semibold mb-4 text-sm uppercase tracking-wide">
                    Difficulty Level
                  </label>
                  <div className="flex justify-center gap-3">
                    {["EASY", "MEDIUM", "HARD"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        disabled={phase === "searching"}
                        className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-sm border-2 ${
                          difficulty === d
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/50 scale-105"
                            : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-purple-500 hover:text-purple-300 hover:shadow-md hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic Selection */}
                <div className="mb-8">
                  <label className="block text-purple-300 font-semibold mb-4 text-sm uppercase tracking-wide">
                    Select Topics ({topics.length} selected)
                  </label>
                  <TopicSelector selected={topics} setSelected={setTopics} disabled={phase === "searching"} />
                </div>

                {/* Find Match Button */}
                {phase === "idle" && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={handleFindMatch}
                      className="px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold text-lg hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-xl shadow-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/60 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      disabled={topics.length === 0}
                    >
                      Find Match
                    </button>
                    {topics.length === 0 && (
                      <p className="text-slate-500 text-sm mt-3">Select at least one topic to continue</p>
                    )}
                  </motion.div>
                )}

                {/* Timeout/Error States */}
                {(phase === "timeout" || phase === "error") && (
                  <MatchStatusCard phase={phase} matchData={matchData} onCancel={leave} timeLeft={timeLeft} />
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="matching"
            className="z-10 flex items-center justify-center min-h-screen px-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <MatchStatusCard phase={phase} matchData={matchData} onCancel={leave} timeLeft={timeLeft} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        className="absolute bottom-6 left-0 right-0 text-center text-purple-400/40 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Powered by intelligent peer matching algorithms
      </motion.div>
    </div>
  );
}
