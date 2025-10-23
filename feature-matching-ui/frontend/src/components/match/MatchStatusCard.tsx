"use client"
import { motion } from "framer-motion"
import { CheckCircle2, Clock, XCircle, Users, Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"


export default function MatchStatusCard({
  phase,
  matchData,
  onCancel,
  timeLeft,
}: {
  phase: string
  matchData: any
  onCancel: () => void
  timeLeft: number | null
}) {
  const router = useRouter()
  const handleStartSession = () => {
  if (!matchData?.sessionId) {
    console.error("[MatchStatusCard] Missing sessionId:", matchData)
    alert("No collaboration session found. Please try again.")
    return
  }

// Construct target URL using env and query params
const baseUrl =
  process.env.NEXT_PUBLIC_COLLAB_BASE_URL || "http://localhost:4000";

// ✅ Prefer authenticated userId from JWT (fallback to matchData.userId)
const token = localStorage.getItem("accessToken");
let userIdFromToken: string | null = null;
try {
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userIdFromToken = String(payload.userId);
  }
} catch (err) {
  console.warn("[MatchStatusCard] Failed to parse token:", err);
}

const finalUserId = userIdFromToken || matchData.userId || "guest";

// ✅ Always ensure both parameters exist
// Get the auth token to pass to collaboration UI
const authToken = localStorage.getItem("accessToken");

const collabUrl = `${baseUrl.replace(/\/$/, "")}/collab?sessionId=${
  matchData.sessionId
}&userId=${finalUserId}${authToken ? `&token=${encodeURIComponent(authToken)}` : ''}`;

console.log(`[MatchStatusCard] Redirecting to: ${collabUrl}`);
// Use window.location.href for cross-domain navigation
window.location.href = collabUrl;

}

  if (phase === "searching") {
    return (
      <motion.div
        className="w-full max-w-2xl mx-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-10 shadow-2xl shadow-purple-900/40">
          {/* Animated Icon */}
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
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-purple-400/30"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeOut",
                }}
              />
            </motion.div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-white mb-2">Finding Your Perfect Match</h3>
            <p className="text-purple-300 text-lg">Searching for a peer with similar interests...</p>
          </div>

          {/* Loading Animation */}
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

          {/* Timer */}
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
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Cancel Button */}
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
    )
  }

  if (phase === "matched") {
    return (
      <motion.div
        className="w-full max-w-3xl mx-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.7 }}
      >
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-xl border border-green-500/40 rounded-3xl p-10 shadow-2xl shadow-green-900/40">
          {/* Success Icon with Celebration */}
          <div className="flex justify-center mb-6">
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI) / 3) * 60,
                    y: Math.sin((i * Math.PI) / 3) * 60,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.2,
                    ease: "easeOut",
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <motion.h3
              className="text-4xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Match Found!
            </motion.h3>
            <motion.p
              className="text-green-300 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              You've been paired with a peer. Get ready to code!
            </motion.p>
          </div>

         {/* Match Details */}
<motion.div
  className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-6 mb-6"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5 }}
>
  <h4 className="text-purple-300 font-semibold mb-4 text-lg flex items-center gap-2">
    <Users className="w-5 h-5" />
    Match Details
  </h4>

  <div className="space-y-3">
    {matchData?.matchId && (
      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
        <span className="text-slate-400">Match ID</span>
        <span className="text-white font-mono font-semibold">{matchData.matchId}</span>
      </div>
    )}

    {matchData?.partnerId && (
      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
        <span className="text-slate-400">Partner ID</span>
        <span className="text-white font-mono font-semibold">{matchData.partnerId}</span>
      </div>
    )}

    {matchData?.difficulty && (
      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
        <span className="text-slate-400">Difficulty</span>
        <span className="text-purple-400 font-semibold uppercase">{matchData.difficulty}</span>
      </div>
    )}

    {matchData?.topics && matchData.topics.length > 0 && (
      <div className="py-2">
        <span className="text-slate-400 block mb-2">Topics</span>
        <div className="flex flex-wrap gap-2">
          {matchData.topics.map((topic: string) => (
            <span
              key={topic}
              className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>

        {/* Matched Question Section */}
        {matchData?.question && (
          <motion.div
            className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h4 className="text-purple-300 font-semibold mb-4 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Matched Question
            </h4>

            <div className="space-y-3">
              <p className="text-white font-bold text-xl">
                {matchData.question.title || "Untitled Question"}
              </p>

              {matchData.question.image_url && (
                <div className="mb-4">
                  <img 
                    src={matchData.question.image_url} 
                    alt="Question" 
                    className="max-w-full h-auto rounded-lg border border-slate-600"
                  />
                </div>
              )}

              {matchData.question.description && (
                <p className="text-slate-300 whitespace-pre-wrap">
                  {matchData.question.description}
                </p>
              )}

              {matchData.question.topics && matchData.question.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {matchData.question.topics.map((topic: string) => (
                    <span
                      key={topic}
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>


          {/* Action Button */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button onClick={handleStartSession} className="group px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold text-lg hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-xl shadow-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/60 hover:scale-105 flex items-center gap-2">
              Start Coding Session
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  if (phase === "timeout") {
    return (
      <motion.div
        className="bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Clock className="w-7 h-7 text-orange-400" />
          <p className="text-orange-300 font-bold text-xl">No Match Found</p>
        </div>

        <p className="text-center text-slate-400 mb-6">
          We couldn't find a peer within the time limit. Try adjusting your preferences or try again later.
        </p>

        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-lg shadow-purple-500/40"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    )
  }

  if (phase === "error") {
    return (
      <motion.div
        className="bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <XCircle className="w-7 h-7 text-red-400" />
          <p className="text-red-300 font-bold text-xl">Connection Error</p>
        </div>

        <p className="text-center text-slate-400 mb-6">
          Something went wrong while trying to find a match. Please check your connection and try again.
        </p>

        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-lg shadow-purple-500/40"
          >
            Retry
          </button>
        </div>
      </motion.div>
    )
  }

  return null
}
