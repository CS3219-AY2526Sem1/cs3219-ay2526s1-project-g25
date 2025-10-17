"use client"

import { motion } from "framer-motion"
import { Play, Code2 } from "lucide-react"
import { useState } from "react"

export default function CodePane() {
  const [language, setLanguage] = useState("Python")
  const [code, setCode] = useState("")

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-3/4 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="w-full flex flex-row px-6 py-4 justify-between items-center border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-purple-400" />
          <select
            name="language"
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
          >
            <option value="Python">Python</option>
            <option value="C">C</option>
            <option value="C++">C++</option>
            <option value="Java">Java</option>
            <option value="Javascript">Javascript</option>
          </select>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Run Code
        </motion.button>
      </div>

      {/* Code Editor */}
      <div className="flex-1 p-6 bg-slate-950">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-4 bg-slate-900 text-slate-200 font-mono text-sm rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
          placeholder="// Write your code here..."
          spellCheck={false}
        />
      </div>
    </motion.div>
  )
}