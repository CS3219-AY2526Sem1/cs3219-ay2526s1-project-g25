"use client"

import ChatBox from "./ChatBox"
import ChatBubble from "./ChatBubble"
import AIChatBubble from "./AIChatBubble"
import { motion } from "framer-motion"
import { MessageSquare, Sparkles, Lightbulb, Code, Bug, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { connectCollabSocket } from "@/lib/collabSocket"
import { sendAIMessage, getHint, analyzeCode, debugError } from "@/lib/aiService"
import { getParams } from "@/lib/helpers"
import { useCollabStore } from "@/lib/collabStore"

export default function ChatPane() {
  const [activeTab, setActiveTab] = useState<"chat" | "ai">("chat")
  const [messages, setMessages] = useState<any[]>([])
  const [aiMessages, setAIMessages] = useState<any[]>([])
  const [sendMsg, setSendMsg] = useState<(data: any) => void>(() => () => {})
  const [isAILoading, setIsAILoading] = useState(false)

  const { sessionId, userId } = getParams()

    // Initialize WebSocket
 useEffect(() => {
  console.log("🔌 Opening collab socket...");
  const { ws, send } = connectCollabSocket(sessionId, userId, (msg) => {
    console.log("[ChatPane] Received message:", msg.type);
    
    // Handle regular chat messages
    if (msg.type === "chat:message") {
      if (msg.userId !== userId) {
        setMessages((prev) => [...prev, msg]);
      }
    }

    // Handle AI messages
    if (msg.type === "ai:message" || msg.type === "ai" || msg.type?.startsWith("ai-")) {
      console.log("[ChatPane] Received AI message:", msg);
      setAIMessages((prev) => [...prev, msg]);
      setIsAILoading(false);
    }
    
    // Handle session end
    if (msg.type === "session:end") {
      console.log("[ChatPane] Session ended, broadcasting to page");
      // Trigger session end event that the collab page listens to
      window.dispatchEvent(new CustomEvent('session-end', { detail: msg }));
    }

    // Initialize chat history
    if (msg.type === "init") {
      console.log("[ChatPane] Initializing with chat history:", msg);
      if (Array.isArray(msg.chat)) {
        setMessages(msg.chat);
      }
      if (Array.isArray(msg.aiChat)) {
        console.log("[ChatPane] Initializing AI chat history:", msg.aiChat);
        setAIMessages(msg.aiChat);
      }
    }
    
    if (msg.type === "session:end") {
        alert("Your partner has ended the session. Returning to dashboard...");
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard";
        window.location.href = dashboardUrl;
    }
  });

  setSendMsg(() => send);

  // 🔒 Cleanup: close socket when component unmounts or deps change
  return () => {
    console.log("❌ Closing collab socket...");
    try {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
      // or simply: ws?.close();
    } catch (e) {
      console.warn("[ChatPane] error closing socket:", e);
    }
  };

}, [sessionId, userId]); // Don't include currentLanguage - it causes WebSocket to reconnect


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
    try {
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
        // Show error in AI chat
        const errorMsg = {
          userId: "ai-assistant",
          text: `❌ ${result.error || "Failed to get hint. Try asking via chat instead!"}`,
          ts: Date.now(),
          type: "ai"
        }
        setAIMessages((prev) => [...prev, errorMsg])
      }
    } catch (error: any) {
      setIsAILoading(false)
      const errorMsg = {
        userId: "ai-assistant",
        text: `❌ Error: ${error.message}`,
        ts: Date.now(),
        type: "ai"
      }
      setAIMessages((prev) => [...prev, errorMsg])
    }
  }

  // Analyze code with AI
  async function handleAnalyzeCode() {
    setIsAILoading(true)
    try {
      // Get current language from store at the time of analysis
      const currentLanguage = useCollabStore.getState().currentLanguage
      console.log(`[ChatPane] Analyzing code with language: ${currentLanguage}`)
      const result = await analyzeCode(sessionId, undefined, currentLanguage)
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
        // Show error in AI chat
        const errorMsg = {
          userId: "ai-assistant",
          text: `❌ ${result.error || "Failed to analyze code. Try asking via chat instead!"}`,
          ts: Date.now(),
          type: "ai"
        }
        setAIMessages((prev) => [...prev, errorMsg])
      }
    } catch (error: any) {
      setIsAILoading(false)
      const errorMsg = {
        userId: "ai-assistant",
        text: `❌ Error: ${error.message}`,
        ts: Date.now(),
        type: "ai"
      }
      setAIMessages((prev) => [...prev, errorMsg])
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full w-full bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl flex flex-col overflow-hidden"
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
