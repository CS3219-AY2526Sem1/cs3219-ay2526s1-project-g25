"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import { useEffect, useState, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { getAccessToken, parseJwt, isAuthenticated } from "@/lib/auth";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

const USER_SVC =
  process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      // read temp key
      const url = new URL(window.location.href);
      const temp = url.searchParams.get("temp") || url.searchParams.get("t");

      // if we already have a collab token (refresh), reuse it
      const existingCollabToken = sessionStorage.getItem("collabToken");
      if (!temp && existingCollabToken) {
        const claims = parseJwt<{ userId: string }>(existingCollabToken);
        if (claims?.userId) setUserId(String(claims.userId));
        setReady(true);
        return;
      }

      if (!temp) {
        alert("Your session link expired. Please rejoin from Matching.");
        window.location.href =
          (process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000") +
          "/dashboard";
        return;
      }

      try {
        // redeem temp → short-lived collab JWT
        const res = await fetch(`${USER_SVC}/auth/redeem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tempKey: temp,
            audience: "collab",
            sessionId, // bind the token to this session if your backend checks it
          }),
        });

        if (!res.ok) {
          alert("This session link has expired. Please rejoin from Matching.");
          window.location.href =
            (process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000") +
            "/dashboard";
          return;
        }

        const { token } = await res.json();
        if (!token) throw new Error("No token returned");

        // store short-lived collab JWT in sessionStorage (NOT in URL)
        sessionStorage.setItem("collabToken", token);

        // set userId from claims (or keep your param fallback)
        const claims = parseJwt<{ userId: string }>(token);
        if (claims?.userId) setUserId(String(claims.userId));

        // clean URL: remove temp param so it can’t be reused/copied
        url.searchParams.delete("temp");
        url.searchParams.delete("t");
        window.history.replaceState({}, "", url.toString());

        setReady(true);
      } catch (e) {
        console.error("[CollabPage] redeem failed:", e);
        alert("Could not authenticate collaboration session. Please rejoin from Matching.");
        window.location.href =
          (process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000") +
          "/dashboard";
      }
    })();
  }, [sessionId]);

  /* ----------  WebSocket  ---------- */
  useEffect(() => {
    if (!ready || !sessionId || !userId) return;

    const token = sessionStorage.getItem("collabToken");
    if (!token) {
      console.error("[CollabPage] Missing collabToken for WS");
      return;
    }

    const wsBase =
      process.env.NEXT_PUBLIC_COLLAB_WS_URL || "ws://localhost:3004";
    const safeWsBase = wsBase.replace(/\/+$/, "");
    const url = new URL(/\/ws$/.test(safeWsBase) ? safeWsBase : `${safeWsBase}/ws`);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("userId", userId);
    url.searchParams.set("token", token); // ← add the short-lived JWT

    console.log("[CollabPage] Connecting to /ws");
    const ws = new WebSocket(url.toString());
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[CollabPage] WebSocket connected to /ws ✅");
    };

    ws.onerror = (error) => {
      console.error("[CollabPage] WebSocket error:", error);
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      console.log("[CollabPage] Received message:", msg.type);
      // if (msg.type === "session:end") {
      //   console.log("[CollabPage] Received session:end message:", msg);
      //   document.body.style.transition = "opacity 0.4s ease";
      //   document.body.style.opacity = "0";
      //   setTimeout(() => {
      //     const dashboardUrl =
      //       process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard";
      //     window.location.href = dashboardUrl;
      //   }, 400);
      // }
      if (msg.type === "session:end") {
        console.log("[CollabPage] Received session:end message:", msg);
        if ((window as any).__sessionEndDispatched) return;
        (window as any).__sessionEndDispatched = true;
        window.dispatchEvent(new CustomEvent("session-end", { detail: msg }));
      }
    };

    ws.onclose = (event) => {
      console.log("[CollabPage] WebSocket closed:", event.code, event.reason);
    };

    const sendFunction = (m: any) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
      else ws.addEventListener("open", () => ws.send(JSON.stringify(m)), { once: true });
    };
    setSendMsg(() => sendFunction);

    return () => {
      try { ws.close(); } catch {}
    };
  }, [ready, sessionId, userId]);

  /* ----------  Fetch Question  ---------- */
  useEffect(() => {
    // client-only
    setIsClient(true);

    // ✅ Source userId from the redeemed short-lived collab token (Step 4)
    const collabToken = sessionStorage.getItem("collabToken");
    if (collabToken) {
      const payload = parseJwt<{ userId: number }>(collabToken);
      setUserId(payload?.userId ? String(payload.userId) : paramUserId);
    } else if (paramUserId) {
      // soft fallback if token missing (e.g., before redeem finishes)
      setUserId(paramUserId);
    } else {
      console.log("[CollabPage] No authentication found (no collabToken, no userId param).");
    }

    if (!sessionId) return;

    (async () => {
      try {
        // Fetch session info from Collaboration backend (same as before)
        const baseUrl =
          process.env.NEXT_PUBLIC_COLLAB_BASE_URL || "http://localhost:3004";
        console.log("[CollabPage] Fetching session with baseUrl:", baseUrl);
        const token = sessionStorage.getItem("collabToken"); // short-lived JWT from /auth/redeem
        const res = await fetch(`${baseUrl}/sessions/${sessionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();

        if (!data.session) throw new Error("No session found");
        const qid = data.session.questionId;

        // Fetch question details from Question Service (same as before)
        const questionBaseUrl =
          process.env.NEXT_PUBLIC_QUESTION_BASE_URL || "http://localhost:5050";
        console.log(
          "[CollabPage] Fetching question with baseUrl:",
          questionBaseUrl
        );
        const qres = await fetch(`${questionBaseUrl}/questions/${qid}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const qdata = await qres.json();

        setQuestion(qdata);
      } catch (err) {
        console.error("[CollabPage] Failed to fetch question:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, paramUserId]);

  // handle session end event
  useEffect(() => {
    const onSessionEnd = () => {
      if ((window as any).__sessionEndHandled) return;
      (window as any).__sessionEndHandled = true;

      alert("Your partner has ended the session. Returning to dashboard...");
      document.body.style.transition = "opacity 0.4s ease";
      document.body.style.opacity = "0";

      setTimeout(() => {
        const dashboardUrl =
          process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard";
        window.location.href = dashboardUrl;
      }, 400);
    };

    window.addEventListener("session-end", onSessionEnd);
    return () => window.removeEventListener("session-end", onSessionEnd);
  }, []);


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
