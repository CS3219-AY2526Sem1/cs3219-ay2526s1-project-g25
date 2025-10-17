"use client"

import ChatBox from "./ChatBox"
import ChatBubble from "./ChatBubble"
import { motion } from "framer-motion"
import { MessageSquare, Sparkles } from "lucide-react"
import { useState } from "react"

export default function ChatPane() {
  const [activeTab, setActiveTab] = useState<"chat" | "ai">("chat")

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-1/3 h-full bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl flex flex-col overflow-hidden"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-700/50 bg-slate-800/50">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
            activeTab === "chat" ? "text-white" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </div>
          {activeTab === "chat" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
            activeTab === "ai" ? "text-white" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Chat
          </div>
          {activeTab === "ai" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400"
            />
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <ChatBubble isUser={false}>Hey! Ready to solve this problem?</ChatBubble>
        <ChatBubble isUser={true}>Yes! Let's start with the brute force approach</ChatBubble>
        <ChatBubble isUser={false}>Good idea. We can optimize later</ChatBubble>
        <ChatBubble isUser={true}>I'll write the initial solution</ChatBubble>
        <ChatBubble isUser={false}>Looks good! Let me add some edge cases</ChatBubble>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
        <ChatBox />
      </div>
    </motion.div>
  )
}