"use client"

import type React from "react"

import { motion } from "framer-motion"

interface ChatBubbleProps {
  isUser: boolean
  children: React.ReactNode
}

export default function ChatBubble({ isUser, children }: ChatBubbleProps) {
  const bubble_justify = isUser ? "justify-end" : "justify-start"
  const bubble_color = isUser ? "bg-gradient-to-r from-purple-600 to-purple-500" : "bg-slate-800"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full flex ${bubble_justify}`}
    >
      <div className={`px-4 py-2.5 ${bubble_color} rounded-2xl max-w-[80%] shadow-lg`}>
        <p className="text-white text-sm leading-relaxed">{children}</p>
      </div>
    </motion.div>
  )
}
