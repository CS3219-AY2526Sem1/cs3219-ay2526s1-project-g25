"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

export default function CollabPage() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("sessionId");
  const userId = params.get("userId");
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        alert("Your partner ended the session.");
        router.push("/dashboard");
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
    if (!sessionId) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_COLLAB_BASE_URL}/sessions/${sessionId}`);
        const data = await res.json();
        const qid = data.session?.questionId;
        if (!qid) throw new Error("No question found");
        const qres = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_BASE_URL}/questions/${qid}`);
        setQuestion(await qres.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) return <div className="text-white p-10">Loading session...</div>;
  if (!question) return <div className="text-red-400 p-10">No question found.</div>;

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
                  <CodePane />
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
