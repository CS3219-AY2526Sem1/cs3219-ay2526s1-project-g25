"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, XCircle, Users, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function MatchStatusCard({
  phase,
  matchData,
  onCancel,
  timeLeft: externalTimeLeft,
}: {
  phase: string;
  matchData: any;
  onCancel: () => void;
  timeLeft: number | null;
}) {
  const router = useRouter();

  // --- Stable internal timer fix ---
  const [timeLeft, setTimeLeft] = useState<number | null>(externalTimeLeft);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "searching") return;

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const totalDuration = 120_000; // 2 minutes in ms
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current!;
      const remaining = Math.max(totalDuration - elapsed, 0);
      setTimeLeft(Math.floor(remaining / 1000));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (externalTimeLeft !== null) setTimeLeft(externalTimeLeft);
  }, [externalTimeLeft]);

  // const handleStartSession = () => {
  //   if (!matchData?.sessionId) {
  //     console.error("[MatchStatusCard] Missing sessionId:", matchData);
  //     alert("No collaboration session found. Please try again.");
  //     return;
  //   }

  //   const baseUrl =
  //     process.env.NEXT_PUBLIC_COLLAB_BASE_URL || "http://localhost:4000";

  //   const token = localStorage.getItem("accessToken");
  //   let userIdFromToken: string | null = null;
  //   try {
  //     if (token) {
  //       const payload = JSON.parse(atob(token.split(".")[1]));
  //       userIdFromToken = String(payload.userId);
  //     }
  //   } catch (err) {
  //     console.warn("[MatchStatusCard] Failed to parse token:", err);
  //   }

  //   const finalUserId = userIdFromToken || matchData.userId || "guest";
  //   const authToken = localStorage.getItem("accessToken");

  //   const collabUrl = `${baseUrl.replace(/\/$/, "")}/collab?sessionId=${
  //     matchData.sessionId
  //   }&userId=${finalUserId}${
  //     authToken ? `&token=${encodeURIComponent(authToken)}` : ""
  //   }`;

  //   console.log(`[MatchStatusCard] Redirecting to: ${collabUrl}`);
  //   window.location.href = collabUrl;
  // };

  const handleStartSession = async () => {
    if (!matchData?.sessionId) {
      console.error("[MatchStatusCard] Missing sessionId:", matchData);
      alert("No collaboration session found. Please try again.");
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_COLLAB_BASE_URL || "http://localhost:4000";
    const userServiceUrl =
      process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001";
    console.log("[MatchStatusCard] User Service URL:", userServiceUrl);

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("Please log in again — token not found.");
      return;
    }

    // helper to redirect with ?temp
    const go = (tempKey: string) => {
      const collabUrl =
        `${baseUrl.replace(/\/$/, "")}/collab?sessionId=${matchData.sessionId}` +
        `&temp=${encodeURIComponent(tempKey)}`;
      console.log("[MatchStatusCard] Redirecting securely to:", collabUrl);
      window.location.href = collabUrl;
    };

    try {
      // Try 1: Authorization header
      let resp = await fetch(`${userServiceUrl}/auth/temp-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Fallback: body { jwt } if server expects it
      if (resp.status === 401 || resp.status === 400) {
        console.warn("[MatchStatusCard] auth header rejected, retrying with body { jwt } …");
        resp = await fetch(`${userServiceUrl}/auth/temp-token`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jwt: accessToken }),
        });
      }

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("[MatchStatusCard] temp-token failed:", resp.status, txt);
        alert("Failed to create secure session key.");
        return;
      }

      const { tempKey } = await resp.json();
      if (!tempKey) {
        alert("User Service did not return a temp key.");
        return;
      }
      go(tempKey);
    } catch (err) {
      console.error("[MatchStatusCard] Error during temp key creation:", err);
      alert("Error starting session. Please try again.");
    }
  };


  // 🕓 SEARCHING PHASE
  if (phase === "searching") {
    return (
      <motion.div
        className="w-full max-w-2xl mx-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-10 shadow-2xl shadow-purple-900/40">
          <div className="flex justify-center mb-6">
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Users className="w-12 h-12 text-white" />
              </div>
            </motion.div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-white mb-2">
              Finding Your Perfect Match
            </h3>
            <p className="text-purple-300 text-lg">
              Searching for a peer with similar interests...
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-purple-500 rounded-full"
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {timeLeft !== null && (
            <motion.div
              className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-purple-400" />
                <p className="text-purple-300 text-lg">
                  Time remaining:{" "}
                  <span className="font-mono font-bold text-2xl text-white">
                    {Math.floor(timeLeft / 60)}:
                    {String(timeLeft % 60).padStart(2, "0")}
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex justify-center">
            <button
              onClick={onCancel}
              className="px-8 py-3 border-2 border-purple-500/50 bg-slate-800/50 rounded-xl text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-300 font-medium"
            >
              Cancel Search
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // MATCHED PHASE
  if (phase === "matched") {
    return (
      <motion.div
        className="w-full max-w-3xl mx-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.7 }}
      >
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-xl border border-green-500/40 rounded-3xl p-10 shadow-2xl shadow-green-900/40">
          <div className="flex justify-center mb-6">
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.05, 1] }}
              transition={{ type: "spring", duration: 1 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full shadow-lg shadow-green-500/50 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-green-300/50"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeOut",
                  }}
                />
              </div>

              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ top: "50%", left: "50%" }}
                  initial={{ scale: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI) / 3) * 60,
                    y: Math.sin((i * Math.PI) / 3) * 60,
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeOut",
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="text-center mb-8">
            <motion.h3
              className="text-4xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Match Found!
            </motion.h3>
            <motion.p
              className="text-green-300 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              You’ve been paired with a peer. Get ready to code!
            </motion.p>
          </div>

          <motion.div
            className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-purple-300 font-semibold mb-4 text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> Match Details
            </h4>

            <div className="space-y-3">
              {matchData?.matchId && (
                <div className="flex justify-between items-center border-b border-slate-700/50 py-2">
                  <span className="text-slate-400">Match ID</span>
                  <span className="text-white font-mono font-semibold">
                    {matchData.matchId}
                  </span>
                </div>
              )}

              {matchData?.difficulty && (
                <div className="flex justify-between items-center border-b border-slate-700/50 py-2">
                  <span className="text-slate-400">Difficulty</span>
                  <span className="text-purple-400 font-semibold uppercase">
                    {matchData.difficulty}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {matchData?.question && (
            <motion.div
              className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h4 className="text-purple-300 font-semibold mb-4 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Matched Question
              </h4>
              <p className="text-white font-bold text-xl">
                {matchData.question.title || "Untitled Question"}
              </p>
              {matchData.question.description && (
                <div className="text-slate-300 mt-2 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {matchData.question.description}
                  </ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={handleStartSession}
              className="group px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold text-lg hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-xl shadow-purple-500/50 hover:scale-105 flex items-center gap-2"
            >
              Start Coding Session
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // TIMEOUT
  if (phase === "timeout") {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8 text-center">
        <Clock className="w-7 h-7 text-orange-400 mx-auto mb-3" />
        <p className="text-orange-300 font-bold text-xl mb-4">
          No Match Found
        </p>
        <p className="text-slate-400 mb-6">
          We couldn’t find a peer within the time limit. Try again later.
        </p>
        <button
          onClick={onCancel}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-lg shadow-purple-500/40"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ERROR
  if (phase === "error") {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
        <XCircle className="w-7 h-7 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 font-bold text-xl mb-4">
          Connection Error
        </p>
        <p className="text-slate-400 mb-6">
          Something went wrong while trying to find a match. Please try again.
        </p>
        <button
          onClick={onCancel}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-lg shadow-purple-500/40"
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}