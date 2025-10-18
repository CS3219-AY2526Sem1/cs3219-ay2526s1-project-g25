"use client"

import ChatBox from "./ChatBox"
import ChatBubble from "./ChatBubble"
import AIChatBubble from "./AIChatBubble"
import { motion } from "framer-motion"
import { MessageSquare, Sparkles, Lightbulb, Code, Bug, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { connectCollabSocket } from "@/lib/collabSocket"
import { sendAIMessage, getHint, analyzeCode, debugError } from "@/lib/aiService"

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
  const [aiMessages, setAIMessages] = useState<any[]>([])
  const [sendMsg, setSendMsg] = useState<(data: any) => void>(() => () => {})
  const [isAILoading, setIsAILoading] = useState(false)

  const { sessionId, userId } = getParams()

  // Initialize WebSocket
  useEffect(() => {
    const { send } = connectCollabSocket(sessionId, userId, (msg) => {
      // Handle regular chat messages
      if (msg.type === "chat:message") {
        if (msg.userId !== userId) {
          setMessages((prev) => [...prev, msg]);
        }
      }

      // Handle AI messages from WebSocket
      if (msg.type === "ai:message") {
        console.log("✅ Received AI message:", msg);
        setAIMessages((prev) => [...prev, msg]);
        setIsAILoading(false);
      }

      // Initialize chat and AI chat history
      if (msg.type === "init") {
        if (Array.isArray(msg.chat)) {
          setMessages(msg.chat);
        }
        if (Array.isArray(msg.aiChat)) {
          setAIMessages(msg.aiChat);
        }
      }
    });

    setSendMsg(() => send);
  }, [sessionId, userId]);

  // Handle sending a regular chat message
  function handleSend(text: string) {
    if (!text.trim()) return
    const msg = { type: "chat:message", text, userId }
    sendMsg(msg)
    setMessages((prev) => [...prev, { ...msg, ts: Date.now() }])
  }

  // Handle sending an AI message via WebSocket for real-time response
  function handleAISend(text: string) {
    if (!text.trim()) return
    console.log("📤 Sending AI message:", text);
    setIsAILoading(true)
    
    // Add user message to AI chat
    const userMsg = { userId, text, ts: Date.now(), type: "user" }
    setAIMessages((prev) => [...prev, userMsg])

    // Send to backend via WebSocket
    sendMsg({ type: "ai:message", text })
  }

  // Get a hint from AI
  async function handleGetHint() {
    setIsAILoading(true)
    const result = await getHint(sessionId)
    setIsAILoading(false)

    if (result.success && result.hint) {
      const hintMsg = {
        userId: "ai-assistant",
        text: result.hint,
        ts: Date.now(),
        type: "ai-hint"
      }
      setAIMessages((prev) => [...prev, hintMsg])
    } else {
      console.error("Failed to get hint:", result.error)
    }
  }

  // Analyze code with AI
  async function handleAnalyzeCode() {
    setIsAILoading(true)
    const result = await analyzeCode(sessionId)
    setIsAILoading(false)

    if (result.success && result.analysis) {
      const analysisMsg = {
        userId: "ai-assistant",
        text: result.analysis,
        ts: Date.now(),
        type: "ai-analysis"
      }
      setAIMessages((prev) => [...prev, analysisMsg])
    } else {
      console.error("Failed to analyze code:", result.error)
    }
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
        {activeTab === "chat" ? (
          messages.map((m, i) => (
            <ChatBubble key={i} isUser={m.userId === userId}>
              {m.text}
            </ChatBubble>
          ))
        ) : (
          <>
            {aiMessages.map((m, i) => (
              m.userId === "ai-assistant" ? (
                <AIChatBubble key={i} type={m.type || "ai"}>
                  {m.text}
                </AIChatBubble>
              ) : (
                <ChatBubble key={i} isUser={true}>
                  {m.text}
                </ChatBubble>
              )
            ))}
            {isAILoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-slate-400 text-sm"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is thinking...</span>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* AI Quick Actions */}
      {activeTab === "ai" && (
        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetHint}
              disabled={isAILoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-xs font-medium rounded-lg border border-yellow-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Get Hint
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAnalyzeCode}
              disabled={isAILoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Code className="w-3.5 h-3.5" />
              Analyze Code
            </motion.button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
        <ChatBox onSend={activeTab === "chat" ? handleSend : handleAISend} />
      </div>
    </motion.div>
  )
}
