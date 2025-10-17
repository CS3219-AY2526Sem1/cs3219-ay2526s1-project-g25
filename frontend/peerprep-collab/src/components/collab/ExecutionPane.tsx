"use client"

import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Terminal } from "lucide-react"

export default function ExecutionPane() {
  const getRowColour = (status: string) => {
    switch (status) {
      case "Passed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "Failed":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-slate-800 text-slate-400 border-slate-700"
    }
  }

  const getIcon = (status: string) => {
    switch (status) {
      case "Passed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      case "Failed":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-1/4 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 flex items-center gap-2">
        <Terminal className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Execution Results</h3>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80 sticky top-0 z-10">
            <tr className="text-left text-slate-400 uppercase text-xs">
              <th className="px-6 py-3 font-semibold">Test Case</th>
              <th className="px-6 py-3 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            <motion.tr
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`border-b border-slate-700/30 ${getRowColour("Passed")} transition-all hover:bg-emerald-500/20`}
            >
              <td className="py-3 px-6 font-mono text-slate-300">[1, 8, 9]</td>
              <td className="py-3 px-6 font-medium flex items-center gap-2">
                {getIcon("Passed")}
                Passed
              </td>
            </motion.tr>
            <motion.tr
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`border-b border-slate-700/30 ${getRowColour("Failed")} transition-all hover:bg-red-500/20`}
            >
              <td className="py-3 px-6 font-mono text-slate-300">[5, 8, 2]</td>
              <td className="py-3 px-6 font-medium flex items-center gap-2">
                {getIcon("Failed")}
                Failed
              </td>
            </motion.tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}