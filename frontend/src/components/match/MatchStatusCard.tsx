"use client";
import { motion } from "framer-motion";

export default function MatchStatusCard({
  phase,
  matchData,
  onCancel,
}: {
  phase: string;
  matchData: any;
  onCancel: () => void;
}) {
  return (
    <motion.div
      className="mt-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {phase === "idle" && <p className="text-gray-400">Ready to find your peer.</p>}
      {phase === "searching" && (
        <>
          <p className="text-emerald-400 animate-pulse">Searching for a partner…</p>
          <button
            onClick={onCancel}
            className="mt-4 text-sm px-4 py-1 border border-gray-600 rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
        </>
      )}
      {phase === "matched" && (
        <div className="p-4 border border-emerald-400 rounded-xl mt-2 bg-emerald-900/20">
          <p className="text-lg text-emerald-300">Matched successfully!</p>
          <pre className="text-sm mt-2 text-gray-300">{JSON.stringify(matchData, null, 2)}</pre>
        </div>
      )}
    </motion.div>
  );
}
