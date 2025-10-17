"use client"

import { Send } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export default function ChatBox() {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (message.trim()) {
      // Handle send logic
      setMessage("")
    }
  }

  return (
    <div className="w-full flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="flex-1 bg-transparent text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none"
        placeholder="Type your message..."
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSend}
        className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
      >
        <Send className="w-4 h-4 text-white" />
      </motion.button>
    </div>
  )
}

