"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { getAccessToken, parseJwt, isAuthenticated } from "@/lib/auth";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

export default function CollabPage() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("sessionId");
  const paramUserId = params.get("userId");
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(paramUserId || null); // initialize from param safely
  const [isClient, setIsClient] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [sendMsg, setSendMsg] = useState<(msg: any) => void>(() => () => {});

  /* ----------  WebSocket  ---------- */
  useEffect(() => {
    if (!sessionId || !userId) return;
    const wsUrl = `${process.env.NEXT_PUBLIC_COLLAB_WS_URL}/ws?sessionId=${sessionId}&userId=${userId}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "session:end") {
        document.body.style.transition = "opacity 0.4s ease";
        document.body.style.opacity = "0";
        setTimeout(() => {
          const dashboardUrl =
            process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard";
          window.location.href = dashboardUrl;
        }, 400);
      }
    };

    const sendFunction = (m: any) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
      else ws.addEventListener("open", () => ws.send(JSON.stringify(m)), { once: true });
    };
    setSendMsg(() => sendFunction);
    return () => ws.close();
  }, [sessionId, userId, router]);

  /* ----------  Fetch Question  ---------- */
  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    // Get user authentication - check URL params first, then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const urlUserId = urlParams.get("userId");
    
    console.log('[CollabPage] URL params:', { urlToken: urlToken ? 'present' : 'missing', urlUserId });
    
    if (urlToken) {
      // Token passed via URL - store it and use it
      console.log('[CollabPage] Using token from URL');
      localStorage.setItem("accessToken", urlToken);
      const payload = parseJwt<{ userId: number }>(urlToken);
      setUserId(payload?.userId ? String(payload.userId) : urlUserId);
    } else if (isAuthenticated()) {
      // No URL token, check localStorage
      console.log('[CollabPage] Using token from localStorage');
      const token = getAccessToken();
      if (token) {
        const payload = parseJwt<{ userId: number }>(token);
        setUserId(payload?.userId ? String(payload.userId) : null);
      }
    } else if (urlUserId) {
      // Fallback to URL userId if no token
      console.log('[CollabPage] Using userId from URL as fallback');
      setUserId(urlUserId);
    } else {
      console.log('[CollabPage] No authentication found');
    }

    if (!sessionId) return;
    (async () => {
      try {
        // Fetch session info from Collaboration backend
        const baseUrl = process.env.NEXT_PUBLIC_COLLAB_BASE_URL || 'http://localhost:3004';
        console.log('[CollabPage] Fetching session with baseUrl:', baseUrl);
        const res = await fetch(`${baseUrl}/sessions/${sessionId}`);
        const data = await res.json();

        if (!data.session) throw new Error("No session found");
        const qid = data.session.questionId;

        // Fetch question details from Question Service
        const questionBaseUrl = process.env.NEXT_PUBLIC_QUESTION_BASE_URL || 'http://localhost:5050';
        console.log('[CollabPage] Fetching question with baseUrl:', questionBaseUrl);
        const qres = await fetch(`${questionBaseUrl}/questions/${qid}`);
        const qdata = await qres.json();

        setQuestion(qdata);
      } catch (err) {
        console.error("[CollabPage] Failed to fetch question:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (loading) return <div className="text-white p-10">Loading session...</div>;
  if (!question) return <div className="text-red-400 p-10">No question found.</div>;
  if (!userId) return <div className="text-red-400 p-10">User ID not found. Please ensure you're accessing this page from the matching interface.</div>;

  /* ----------  Layout  ---------- */
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-3">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full w-full rounded-xl border border-slate-800 shadow-xl overflow-hidden"
      >
        <PanelGroup direction="horizontal" className="h-full">
          {/* ----------  Left: Question  ---------- */}
          <Panel defaultSize={25} minSize={18} maxSize={40}>
            <div className="h-full w-full overflow-y-auto">
              <QuestionPane
                question={question}
                sendMsg={sendMsg}
                sessionId={sessionId}
                userId={userId}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-[3px] bg-slate-800 hover:bg-indigo-500 transition-colors cursor-col-resize" />

          {/* ----------  Middle: Code + Execution  ---------- */}
          <Panel defaultSize={50} minSize={30} maxSize={60}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={65} minSize={40}>
                <div className="h-full w-full">
                  <CodePane question={question} />
                </div>
              </Panel>
              <PanelResizeHandle className="h-[3px] bg-slate-800 hover:bg-indigo-500 transition-colors cursor-row-resize" />
              <Panel defaultSize={35} minSize={20}>
                <div className="h-full w-full">
                  <ExecutionPane />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-[3px] bg-slate-800 hover:bg-indigo-500 transition-colors cursor-col-resize" />

          {/* ----------  Right: Chat  ---------- */}
          <Panel defaultSize={25} minSize={18} maxSize={35}>
            <div className="h-full w-full overflow-hidden">
              <ChatPane />
            </div>
          </Panel>
        </PanelGroup>
      </motion.div>
    </div>
  );
}
