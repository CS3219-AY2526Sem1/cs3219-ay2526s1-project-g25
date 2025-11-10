"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Sparkles, Lightbulb, Bug, Code } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { HTMLAttributes } from "react";

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
        <div className="text-slate-100 text-sm leading-relaxed max-w-none overflow-hidden">
          {/* Support for markdown formatted text */}
          {typeof children === "string" ? (
            <ReactMarkdown
              components={{
                // Custom styling for markdown elements
                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-100 mt-4 mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-200 mt-3 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-bold text-slate-300 mt-2 mb-1" {...props} />,
                p: ({node, children, ...props}) => (
                  <p className="mb-3 leading-relaxed break-words" {...props}>
                    {children}
                  </p>
                ),
                strong: ({node, ...props}) => <strong className="font-bold text-purple-300" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                code: (
                  { node, inline = false, ...props }:
                  { node?: unknown; inline?: boolean } & HTMLAttributes<HTMLElement>
                ) =>
                  inline ? (
                    <code
                      className="bg-slate-800 px-1.5 py-0.5 rounded text-purple-300 text-xs font-mono inline-block"
                      {...props}
                    />
                  ) : (
                    <code className="text-slate-200 text-xs font-mono" {...props} />
                  ),
                pre: ({node, ...props}) => (
                  <pre className="bg-slate-800 p-3 rounded-lg text-slate-200 text-xs font-mono my-3 overflow-x-auto max-w-full whitespace-pre-wrap break-words" {...props} />
                ),
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="ml-4" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-purple-500 pl-4 italic text-slate-300 my-3" {...props} />
                ),
              }}
            >
              {children as string}
            </ReactMarkdown>
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

