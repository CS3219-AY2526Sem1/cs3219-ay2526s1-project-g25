"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import { useEffect, useState, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { redeemTempFromQuery, getAccessToken, parseJwt, isAuthenticated } from "@/lib/auth";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

function CollabPage() {
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
  const [authReady, setAuthReady] = useState(false);

  /* ----------  Authentication Setup  ---------- */
  useEffect(() => {
    (async () => {
      try {
        // Redeems ?temp=… into a short-lived token, stores it in sessionStorage,
        // and scrubs ?temp from the URL.
        const token = await redeemTempFromQuery();

        if (token) {
          console.log("[CollabPage] Redeem successful. Token length:", token.length);
          sessionStorage.setItem("collabToken", token); // (redundant but explicit)
        } else {
          console.warn("[CollabPage] No token returned from redeemTempFromQuery");
        }
      } catch (e) {
        console.error("[CollabPage] redeem failed", e);
        console.error("[CollabPage] Ensure NEXT_PUBLIC_USER_SERVICE_URL is set correctly, currently:", process.env.NEXT_PUBLIC_USER_SERVICE_URL);
        // Non-fatal: page can still try legacy/localStorage flows
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  /* ----------  WebSocket  ---------- */
  useEffect(() => {
    if (!authReady) return;
    if (!sessionId || !userId) return;
    const baseUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL || "ws://localhost:3004";
    const wsUrl = `${baseUrl}/ws?sessionId=${sessionId}&userId=${userId}`;
    console.log("[CollabPage] Connecting to WebSocket:", wsUrl);

    const token = typeof window !== "undefined" ? sessionStorage.getItem("collabToken") : null;
    if (!token) {
      console.warn("[CollabPage] No collabToken yet — skipping WS connect until redeem completes.");
      return;
    }

    const ws = new WebSocket(wsUrl, token ? ['bearer', token] as string[] : undefined);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[CollabPage] WebSocket connected to /ws");
    };
    
    ws.onerror = (error) => {
      console.error("[CollabPage] WebSocket error:", error);
    };
    
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      console.log("[CollabPage] Received message:", msg.type);
      if (msg.type === "session:end") {
        console.log("[CollabPage] Received session:end message:", msg);
        document.body.style.transition = "opacity 0.4s ease";
        document.body.style.opacity = "0";
        setTimeout(() => {
          const dashboardUrl =
            process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard";
          window.location.href = dashboardUrl;
        }, 400);
      }
    };
    
    ws.onclose = (event) => {
      console.log("[CollabPage] WebSocket closed:", event.code, event.reason);
    };
    
    // Listen for session end from other components
    const handleSessionEnd = (e: CustomEvent) => {
      const msg = e.detail;
      console.log("[CollabPage] Session end event received:", msg);
      document.body.style.transition = "opacity 0.4s ease";
      document.body.style.opacity = "0";
      setTimeout(() => {
        const dashboardUrl =
          process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard";
        window.location.href = dashboardUrl;
      }, 400);
    };
    
    window.addEventListener('session-end', handleSessionEnd as EventListener);

    const sendFunction = (m: any) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
      else ws.addEventListener("open", () => ws.send(JSON.stringify(m)), { once: true });
    };
    setSendMsg(() => sendFunction);
    
    return () => {
      ws.close();
      window.removeEventListener('session-end', handleSessionEnd as EventListener);
    };
  }, [authReady, sessionId, userId, router]);

  /* ----------  Fetch Question  ---------- */
  useEffect(() => {
    // wait until temp redemption has finished
    if (!authReady) return;

    // Mark as client-side rendered
    setIsClient(true);

    // Prefer the newly redeemed collab token (sessionStorage),
    // then fall back to legacy localStorage token (old flow).
    const collab = typeof window !== "undefined" ? sessionStorage.getItem("collabToken") : null;
    const legacy = getAccessToken(); // your helper that reads localStorage
    const token = collab || legacy || null;

    // Derive userId from whichever token we have (if any)
    if (token) {
      const payload = parseJwt<{ userId: number }>(token);
      setUserId(prev => prev ?? (payload?.userId ? String(payload.userId) : null));
    } else {
      // keep your old fallbacks if you still want them:
      const urlUserIdFromParams = new URLSearchParams(window.location.search).get("userId");
      if (urlUserIdFromParams) setUserId(urlUserIdFromParams);
    }

    if (!sessionId) return;

    (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_COLLAB_BASE_URL || "http://localhost:3004";
        console.log("[CollabPage] Fetching session with baseUrl:", baseUrl, "auth?", !!token);

        const res = await fetch(`${baseUrl}/sessions/${sessionId}`, {
          headers: token ? ({ authorization: `Bearer ${token}` } as HeadersInit) : undefined,
        });

        const data = await res.json();
        if (!data.session) throw new Error("No session found");

        const qid = data.session.questionId;

        const questionBaseUrl =
          process.env.NEXT_PUBLIC_QUESTION_BASE_URL || "http://localhost:5050";
        console.log("[CollabPage] Fetching question with baseUrl:", questionBaseUrl);

        const qres = await fetch(`${questionBaseUrl}/questions/${qid}`);
        const qdata = await qres.json();
        setQuestion(qdata);
      } catch (err) {
        console.error("[CollabPage] Failed to fetch question:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, authReady]); // <-- key change: depend on authReady


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
  if (!userId) return <div className="text-red-400 p-10">User ID not found. Please ensure you&apos;re accessing this page from the matching interface.</div>;
  if (!sessionId) return <div className="text-red-400 p-10">Session ID not found in URL. Please open this page from the matching interface.</div>;

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
                sessionId={sessionId!}
                userId={userId!}
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

export default function CollabPageWrapper() {
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <CollabPage/>
            </Suspense>
        </div>
    )
}
