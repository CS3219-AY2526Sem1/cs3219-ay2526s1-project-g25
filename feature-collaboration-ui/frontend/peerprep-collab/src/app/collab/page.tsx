"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { getAccessToken, parseJwt, isAuthenticated } from "@/lib/auth";

export default function CollabPage() {
  const params = useSearchParams();
  const sessionId = params.get("sessionId");
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

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

    async function fetchSession() {
      try {
        // 1️⃣ Fetch session info from Collaboration backend
        const baseUrl = process.env.NEXT_PUBLIC_COLLAB_BASE_URL || 'http://localhost:3004';
        console.log('[CollabPage] Fetching session with baseUrl:', baseUrl);
        const res = await fetch(`${baseUrl}/sessions/${sessionId}`);
        const data = await res.json();

        if (!data.session) throw new Error("No session found");
        const qid = data.session.questionId;

        // 2️⃣ Fetch question details from Question Service
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
    }

    fetchSession();
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

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-row gap-4">
        <QuestionPane question={question} />
        <div className="w-1/3 flex flex-col gap-4">
          <CodePane question={question} />
          <ExecutionPane />
        </div>
        <ChatPane />
      </motion.div>
    </div>
  );
}
