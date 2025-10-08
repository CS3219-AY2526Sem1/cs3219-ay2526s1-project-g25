import { motion, AnimatePresence } from "framer-motion";

export default function MatchStatusCard({
  phase,
  matchData,
  timeLeft,
  onCancel,
}: {
  phase: string;
  matchData: any;
  timeLeft?: number | null;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="mt-8 text-center"
      >
        {phase === "idle" && (
          <p className="text-gray-400">Ready to find your peer.</p>
        )}

        {phase === "searching" && (
          <div className="flex flex-col items-center">
            <motion.div
              className="relative w-32 h-32 mb-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <svg className="w-full h-full rotate-[-90deg]">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="gray"
                  strokeWidth="6"
                  fill="none"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="#10B981"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={
                    2 * Math.PI * 45 * ((timeLeft ?? 120) / 120)
                  }
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-emerald-400">
                {timeLeft ?? 120}s
              </span>
            </motion.div>
            <p className="text-emerald-400 animate-pulse">
              Searching for a partner…
            </p>
            <button
              onClick={onCancel}
              className="mt-4 text-sm px-4 py-1 border border-gray-600 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        {phase === "matched" && (
          <div className="p-4 border border-emerald-400 rounded-xl mt-2 bg-emerald-900/20">
            <p className="text-lg text-emerald-300">Matched successfully!</p>
            <pre className="text-sm mt-2 text-gray-300">{JSON.stringify(matchData, null, 2)}</pre>
          </div>
        )}

        {phase === "timeout" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-400 mt-3"
          >
            <p>⏰ No match found within the time limit.</p>
            <button
              onClick={onCancel}
              className="mt-3 px-4 py-2 border border-red-500 rounded-md hover:bg-red-500 hover:text-black transition"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
