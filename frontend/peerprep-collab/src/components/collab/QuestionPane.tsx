"use client"

import TagPill from "./TagPill"
import TestCase from "./TestCase"
import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"

export default function QuestionPane() {
  const test_cases = {
    cases: [
      {
        input: "[1, 9, 3]",
        output: "9",
      },
      {
        input: "[5, 2, 8]",
        output: "8",
      },
    ],
  }

  const question_title = "Find Maximum Element"
  const question_description = "Find the largest element given an array."
  const difficulty = "easy"
  const topic = "Graphs"

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-1/3 h-full bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">{question_title}</h2>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TagPill label={difficulty} isDifficulty={true} />
        <TagPill label={topic} isDifficulty={false} />
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</h3>
        <p className="text-slate-300 leading-relaxed">{question_description}</p>
      </div>

      {/* Optional Image */}
      <img
        className="rounded-lg mb-6 w-full object-cover border border-slate-700/50"
        alt="Question Image"
        src="https://picsum.photos/200"
      />

      {/* Test Cases */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Test Cases</h3>
        <div className="space-y-3">
          {(test_cases["cases"] || []).map((el, idx) => (
            <TestCase key={el.input} input={el.input} output={el.output} index={idx + 1} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
