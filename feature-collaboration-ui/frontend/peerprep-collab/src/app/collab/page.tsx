"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";

export default function CollabPage() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("sessionId");
  const userId = params.get("userId");
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const [sendMsg, setSendMsg] = useState<(msg: any) => void>(() => () => {});

    useEffect(() => {
    if (!sessionId || !userId) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_COLLAB_WS_URL}/ws?sessionId=${sessionId}&userId=${userId}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
        console.log("[WS] Connected to collaboration session:", sessionId);
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log("[WS message received]", msg);

        if (msg.type === "session:end") {
        alert("Your partner ended the session. Redirecting to dashboard...");
        router.push("http://localhost:3000/dashboard");
        }
    };

    ws.onclose = () => {
        console.log("[WS] Disconnected from server");
    };

    // ✅ always define sendMsg even if socket not ready yet
    const sendFunction = (msg: any) => {
        if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
        console.log("[WS] Sent message:", msg);
        } else {
        // Wait until it’s open
        ws.addEventListener("open", () => {
            ws.send(JSON.stringify(msg));
            console.log("[WS] Sent (after open):", msg);
        }, { once: true });
        }
    };

    setSendMsg(() => sendFunction);

    return () => {
        ws.close();
    };
    }, [sessionId, userId]);


  useEffect(() => {
    if (!sessionId) return;

    async function fetchSession() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_COLLAB_BASE_URL}/sessions/${sessionId}`);
        const data = await res.json();

        if (!data.session) throw new Error("No session found");
        const qid = data.session.questionId;

        const qres = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_BASE_URL}/questions/${qid}`);
        const qdata = await qres.json();

        setQuestion(qdata);
      } catch (err) {
        console.error("[CollabPage] Failed to fetch question:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  if (loading) return <div className="text-white p-10">Loading session...</div>;
  if (!question) return <div className="text-red-400 p-10">No question found.</div>;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-row gap-4">
        {/* ✅ Now we pass sendMsg to QuestionPane */}
        <QuestionPane question={question} sendMsg={sendMsg} sessionId={sessionId} userId={userId} />
        <div className="w-1/3 flex flex-col gap-4">
          <CodePane />
          <ExecutionPane />
        </div>
        <ChatPane />
      </motion.div>
    </div>
  );
}
