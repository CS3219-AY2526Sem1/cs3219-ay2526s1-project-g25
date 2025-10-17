"use client"

import { motion } from "framer-motion"

interface TagPillProps {
  label: string
  isDifficulty?: boolean
}

export default function TagPill({ label, isDifficulty = false }: TagPillProps) {
  const base = "inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full"
  let colors = "bg-purple-500/20 text-purple-300 border border-purple-500/30"

  if (isDifficulty) {
    const difficultyColors = {
      easy: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      medium: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      hard: "bg-red-500/20 text-red-300 border border-red-500/30",
    }

    colors =
      difficultyColors[label.toLowerCase() as keyof typeof difficultyColors] ||
      "bg-slate-700 text-slate-300 border border-slate-600"
  }

  return (
    <motion.span whileHover={{ scale: 1.05 }} className={`${base} ${colors}`}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </motion.span>
  )
}
