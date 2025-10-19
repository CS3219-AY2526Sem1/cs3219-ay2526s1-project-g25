"use client"

import { motion } from "framer-motion"

interface TestCaseProps {
  input: string
  output: string
  index: number
}

export default function TestCase({ input, output, index }: TestCaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-slate-800 border border-slate-700/50 rounded-xl p-4 shadow-lg hover:shadow-xl hover:border-purple-500/30 transition-all"
    >
      <div className="text-sm space-y-2">
        <div>
          <span className="font-semibold text-purple-400">Input:</span>
          <pre className="mt-1 bg-slate-900 text-slate-300 px-3 py-2 rounded-lg font-mono text-xs border border-slate-700/50">
            {input}
          </pre>
        </div>
        <div>
          <span className="font-semibold text-emerald-400">Output:</span>
          <pre className="mt-1 bg-slate-900 text-slate-300 px-3 py-2 rounded-lg font-mono text-xs border border-slate-700/50">
            {output}
          </pre>
        </div>
      </div>
    </motion.div>
  )
}