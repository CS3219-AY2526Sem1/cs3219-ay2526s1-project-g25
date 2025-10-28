"use client";

import TagPill from "./TagPill";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, LogOut, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function QuestionPane({ question, sendMsg, sessionId, userId }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  if (!question) return null;

  const {
    title = "Untitled Question",
    description = "No description available.",
    difficulty = "unknown",
    topic = "General",
    image_url,
  } = question;

  // Parse test cases safely
  let testCases: any[] = [];
  try {
    if (Array.isArray(question.test_cases)) {
      testCases = question.test_cases;
    } else if (typeof question.test_cases === "string") {
      const parsed = JSON.parse(question.test_cases);
      if (Array.isArray(parsed)) testCases = parsed;
      else if (parsed?.cases) testCases = parsed.cases;
    } else if (question.test_cases?.cases) {
      testCases = question.test_cases.cases;
    }
  } catch (err) {
    console.warn("[QuestionPane] Failed to parse test_cases:", err);
  }

  // Normalize structure
  testCases = testCases.map((tc) => {
    const fixNested = (val: any) => {
      if (Array.isArray(val) && val.length === 1 && Array.isArray(val[0])) {
        return fixNested(val[0]);
      }
      return val;
    };
    const output = tc.output ?? tc.expected;
    return { ...tc, input: fixNested(tc.input), output: fixNested(output) };
  });

  // Handle ending session with smooth modal
  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      console.log("[QuestionPane] Ending session, sending session:end message");
      // Send session:end message via WebSocket to notify other users
      sendMsg({ type: "session:end" });
      console.log("[QuestionPane] session:end message sent successfully");
      
      // Also call the leave endpoint to trigger matching service cleanup
      console.log("[QuestionPane] Calling leave endpoint to clean up matching service");
      try {
        const leaveResponse = await fetch(`${process.env.NEXT_PUBLIC_COLLAB_BASE_URL}/sessions/${sessionId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!leaveResponse.ok) {
          console.error(`[QuestionPane] Leave endpoint returned ${leaveResponse.status}`);
        } else {
          const leaveData = await leaveResponse.json();
          console.log("[QuestionPane] Leave endpoint response:", JSON.stringify(leaveData));
        }
      } catch (err) {
        console.error("[QuestionPane] Failed to call leave endpoint:", err);
      }
      
      const dashboardUrl =
        process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard";
      setTimeout(() => (window.location.href = dashboardUrl), 1200);
    } catch (err) {
      console.error("[UI] Failed to end session:", err);
    } finally {
      setIsEnding(false);
      setShowConfirm(false);
    }
  };

  const isMatrix = (val: any) =>
    Array.isArray(val) && Aarray.isArray(val[0]) && !Array.isArray(val[0][0]);

  const renderValue = (val: any) => {
    if (Array.isArray(val)) {
      if (isMatrix(val)) {
        return (
          <div className="inline-block bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
            <pre className="text-slate-200 font-mono text-sm">
              {"["}
              {val.map((row, i) => (
                <div key={i} className="ml-4 flex">
                  <span>[ </span>
                  <span>{row.join(", ")}</span>
                  <span> ]{i < val.length - 1 ? "," : ""}</span>
                </div>
              ))}
              {"]"}
            </pre>
          </div>
        );
      } else {
        return (
          <code className="bg-slate-800/50 px-2 py-1 rounded-md text-purple-300 text-sm">
            [{val.join(", ")}]
          </code>
        );
      }
    }
    return (
      <code className="bg-slate-800/40 px-2 py-1 rounded-md text-emerald-300 text-sm">
        {String(val)}
      </code>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full w-full bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-semibold rounded-lg border border-red-500/40 transition-all"
          >
            <LogOut className="w-4 h-4" />
            End
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TagPill label={difficulty} isDifficulty />
          <TagPill label={topic} />
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Description
          </h3>
          <div className="text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        </div>

        {image_url && (
          <img
            className="rounded-lg mb-6 w-full object-cover border border-slate-700/50"
            alt="Question"
            src={image_url}
          />
        )}

        {/* Test Cases */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Test Cases
          </h3>
          {testCases.length > 0 ? (
            <div className="space-y-5">
              {testCases.map((el, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 shadow-sm transition hover:border-slate-600/50"
                >
                  <p className="text-slate-400 text-xs font-semibold mb-1 uppercase">
                    Input #{idx + 1}
                  </p>
                  <div className="mb-3">{renderValue(el.input)}</div>
                  <p className="text-slate-400 text-xs font-semibold mb-1 uppercase">Output</p>
                  <div>{renderValue(el.output)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">No test cases available.</p>
          )}
        </div>
      </motion.div>

      {/* ✨ Beautiful Confirmation Popup */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900/90 border border-slate-700 rounded-2xl shadow-2xl p-8 w-[90%] max-w-md text-center relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
            >
              <button
                onClick={() => setShowConfirm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <LogOut className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">End Session?</h2>
                <p className="text-slate-400 text-sm mb-6">
                  This will end the collaboration session for both users. Are you sure you want to
                  proceed?
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isEnding}
                    className="px-5 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEndSession}
                    disabled={isEnding}
                    className={`px-5 py-2 rounded-lg font-semibold text-white transition-all ${
                      isEnding
                        ? "bg-red-500/60 cursor-wait"
                        : "bg-gradient-to-r from-red-600 to-red-500 hover:scale-105 shadow-lg shadow-red-500/30"
                    }`}
                  >
                    {isEnding ? "Ending..." : "End Session"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
