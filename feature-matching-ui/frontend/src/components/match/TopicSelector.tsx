"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function TopicSelector({
  selected,
  setSelected,
  disabled = false,
}: {
  selected: string[]
  setSelected: (topics: string[]) => void
  disabled?: boolean
}) {
  const topics = [
    "Arrays",
    "LinkedList",
    "Binary Tree",
    "Graphs",
    "Dynamic Programming",
    "Trees",
    "Greedy",
    "Two Pointers",
    "Sorting",
    "Recursion",
  ]

  const [showLimitPopup, setShowLimitPopup] = useState(false)

  function toggleTopic(t: string) {
    if (disabled) return

    if (!selected.includes(t) && selected.length >= 4) {
      // show animated popup if limit exceeded
      setShowLimitPopup(true)
      setTimeout(() => setShowLimitPopup(false), 2000) // auto hide after 2s
      return
    }

    setSelected(
      selected.includes(t)
        ? selected.filter((x) => x !== t)
        : [...selected, t]
    )
  }

  return (
    <div className="relative flex flex-col items-center">
      <div className="flex flex-wrap justify-center gap-2.5">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => toggleTopic(t)}
            disabled={disabled}
            className={`px-4 py-2.5 rounded-xl transition-all duration-300 border font-medium text-sm ${
              selected.includes(t)
                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/40 scale-105"
                : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-purple-500 hover:text-purple-300 hover:bg-slate-800 hover:shadow-md hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 💡 Animated popup alert */}
      <AnimatePresence>
        {showLimitPopup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-[-3rem] bg-red-500/90 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg border border-red-400/60 backdrop-blur-sm"
          >
            You can select up to 4 topics only.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
