"use client"

import ChatBox from "./ChatBox"
import ChatBubble from "./ChatBubble"
import { motion } from "framer-motion"
import { MessageSquare, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { connectCollabSocket } from "@/lib/collabSocket"

// Utility: extract params from URL (sessionId, userId)
function getParams() {
  if (typeof window === "undefined") return { sessionId: "", userId: "" }
  const url = new URL(window.location.href)
  return {
    sessionId: url.searchParams.get("sessionId") || "demo-session",
    userId: url.searchParams.get("userId") || "guest-" + Math.random().toString(36).slice(2, 7)
  }
}

export default function ChatPane() {
  const [activeTab, setActiveTab] = useState<"chat" | "ai">("chat")
  const [messages, setMessages] = useState<any[]>([])
  const [sendMsg, setSendMsg] = useState<(data: any) => void>(() => () => {})

  const { sessionId, userId } = getParams()

  // Initialize WebSocket
useEffect(() => {
  const { send } = connectCollabSocket(sessionId, userId, (msg) => {
    if (msg.type === "chat:message") {
      //FIX: Ignore messages that you yourself sent,
      // since they're already added locally in handleSend()
      if (msg.userId !== userId) {
        setMessages((prev) => [...prev, msg]);
      }
    }

    if (msg.type === "init" && Array.isArray(msg.chat)) {
      setMessages(msg.chat);
    }
  });

  setSendMsg(() => send);
}, [sessionId, userId]);


  // Handle sending a new message
  function handleSend(text: string) {
    if (!text.trim()) return
    const msg = { type: "chat:message", text, userId }
    sendMsg(msg)
    setMessages((prev) => [...prev, { ...msg, ts: Date.now() }])
  }

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
        {messages.map((m, i) => (
          <ChatBubble key={i} isUser={m.userId === userId}>
            {m.text}
          </ChatBubble>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
        <ChatBox onSend={handleSend} />
      </div>
    </motion.div>
  )
}
