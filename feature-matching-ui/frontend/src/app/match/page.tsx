"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Zap, Sparkles } from "lucide-react"
import CodeBackground from "@/components/match/CodeBackground"
import TopicSelector from "@/components/match/TopicSelector"
import MatchStatusCard from "@/components/match/MatchStatusCard"
import MatchCanvas from "@/components/match/MatchCanvas"
import { useMatchFlow } from "@/hooks/useMatchFlow"
import { getAccessToken, parseJwt } from "@/lib/auth"

export default function MatchPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true)
    
    // Only run on client side to avoid hydration mismatch
    const token = getAccessToken()
    console.log('[MatchPage] Token found:', token ? token.substring(0, 20) + '...' : 'None');
    
    if (token) {
      const payload = parseJwt<{ userId: number }>(token)
      console.log('[MatchPage] Token payload:', payload);
      setUserId(payload?.userId ? String(payload.userId) : null)
    } else {
      console.log('[MatchPage] No token found, using demo user for testing');
      // For demo purposes, use a demo user ID
      // TODO: Re-enable proper authentication after demo
      setUserId("123");
    }
  }, [])

  const { phase, matchData, join, leave, timeLeft } = useMatchFlow(userId)
  const [topics, setTopics] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState("EASY")

  const handleFindMatch = () => {
    if (topics.length === 0) {
      alert("Please select at least one topic")
      return
    }
    join(topics, difficulty)
  }

  const isMatchingActive = phase === "searching" || phase === "matched"

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-purple-300 text-lg">Loading...</div>
      </div>
    )
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
            PeerPrep
          </h1>
        </div>

        {isClient && userId && (
          <div className="text-purple-300 text-sm font-medium bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/30">
            User: {userId}
          </div>
        )}
      </motion.div>

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
  )
}
