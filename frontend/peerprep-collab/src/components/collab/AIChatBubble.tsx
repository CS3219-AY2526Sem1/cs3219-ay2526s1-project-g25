"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Sparkles, Lightbulb, Bug, Code } from "lucide-react"

interface AIChatBubbleProps {
  children: React.ReactNode
  type?: "ai" | "ai-hint" | "ai-debug" | "ai-analysis"
}

export default function AIChatBubble({ children, type = "ai" }: AIChatBubbleProps) {
  // Different icons and styles based on message type
  const getIcon = () => {
    switch (type) {
      case "ai-hint":
        return <Lightbulb className="w-4 h-4 text-yellow-400" />
      case "ai-debug":
        return <Bug className="w-4 h-4 text-red-400" />
      case "ai-analysis":
        return <Code className="w-4 h-4 text-blue-400" />
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />
    }
  }

  const getGradient = () => {
    switch (type) {
      case "ai-hint":
        return "bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border-yellow-500/30"
      case "ai-debug":
        return "bg-gradient-to-r from-red-600/20 to-red-500/20 border-red-500/30"
      case "ai-analysis":
        return "bg-gradient-to-r from-blue-600/20 to-blue-500/20 border-blue-500/30"
      default:
        return "bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500/30"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full flex justify-start"
    >
      <div className={`relative px-4 py-3 ${getGradient()} border rounded-2xl max-w-[85%] shadow-lg backdrop-blur-sm overflow-hidden`}>
        {/* AI Badge */}
        <div className="flex items-center gap-2 mb-2">
          {getIcon()}
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            {type === "ai-hint"
              ? "AI Hint"
              : type === "ai-debug"
              ? "AI Debug"
              : type === "ai-analysis"
              ? "AI Analysis"
              : "AI Assistant"}
          </span>
        </div>

        {/* Message Content */}
        <div className="text-slate-100 text-sm leading-relaxed prose prose-invert prose-sm max-w-none overflow-hidden">
          {/* Support for formatted text - split by line breaks and code blocks */}
          {typeof children === "string" ? (
            <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{children}</div>
          ) : (
            children
          )}
        </div>

        {/* Animated shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 5,
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.div>
  )
}

