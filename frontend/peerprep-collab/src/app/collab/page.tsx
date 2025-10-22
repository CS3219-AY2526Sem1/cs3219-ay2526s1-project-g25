"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

export default function CollabPage() {
  const params = useSearchParams();
  const sessionId = params.get("sessionId");
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchSession() {
      try {
        // 1️⃣ Fetch session info from Collaboration backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_COLLAB_BASE_URL}/sessions/${sessionId}`);
        const data = await res.json();

        if (!data.session) throw new Error("No session found");
        const qid = data.session.questionId;

        // 2️⃣ Fetch question details from Question Service
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
        <QuestionPane question={question} />
        <div className="w-1/3 flex flex-col gap-4">
          <CodePane />
          <ExecutionPane />
        </div>
        <ChatPane />
      </motion.div>
    </div>
  );
}
