"use client";

import TagPill from "./TagPill";
import { motion } from "framer-motion";
import { BookOpen, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function QuestionPane({ question, sendMsg, sessionId, userId }) {
  const router = useRouter();
  if (!question) return null;

  const {
    title = "Untitled Question",
    description = "No description available.",
    difficulty = "unknown",
    topic = "General",
    image_url,
  } = question;

  //Parse test cases robustly
  let testCases: any[] = [];
  try {
    if (Array.isArray(question.test_cases)) {
      testCases = question.test_cases;
    } else if (typeof question.test_cases === "string") {
      const parsed = JSON.parse(question.test_cases);
      if (Array.isArray(parsed)) testCases = parsed;
      else if (parsed && Array.isArray(parsed.cases)) testCases = parsed.cases;
    } else if (question.test_cases && Array.isArray(question.test_cases.cases)) {
      testCases = question.test_cases.cases;
    }
  } catch (err) {
    console.warn("[QuestionPane] Failed to parse test_cases:", err);
  }

  //Normalize structure
  testCases = testCases.map((tc) => {
    const fixNested = (val: any) => {
      if (Array.isArray(val) && val.length === 1 && Array.isArray(val[0])) {
        return fixNested(val[0]);
      }
      return val;
    };

    const output = tc.output ?? tc.expected;
    return {
      ...tc,
      input: fixNested(tc.input),
      output: fixNested(output),
    };
  });

const handleEndSession = async () => {
  if (!confirm("Are you sure you want to end this session for both users?")) return;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_COLLAB_BASE_URL}/sessions/${sessionId}/leave`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }
    );
    await res.json();
    alert("Session ended. Redirecting to dashboard...");

    //Explicit absolute redirect
    const dashboardUrl =
      process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000/dashboard";
    window.location.href = dashboardUrl;
  } catch (err) {
    console.error("[UI] Failed to end session:", err);
  }
};


  // 🧠 Detect and render arrays/matrices cleanly
  const isMatrix = (val: any) =>
    Array.isArray(val) && Array.isArray(val[0]) && Array.isArray(val[0][0]) === false;

  const renderValue = (val: any) => {
    if (Array.isArray(val)) {
      if (isMatrix(val)) {
        // Matrix formatting (beautiful grid style)
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
        // Array formatting (inline, not matrix)
        return (
          <code className="bg-slate-800/50 px-2 py-1 rounded-md text-purple-300 text-sm">
            [{val.join(", ")}]
          </code>
        );
      }
    }
    // Scalars or strings
    return (
      <code className="bg-slate-800/40 px-2 py-1 rounded-md text-emerald-300 text-sm">
        {String(val)}
      </code>
    );
  };

  return (
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
          onClick={handleEndSession}
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
        <p className="text-slate-300 leading-relaxed">{description}</p>
      </div>

      {/* Optional Image */}
      {image_url && (
        <img
          className="rounded-lg mb-6 w-full object-cover border border-slate-700/50"
          alt="Question Image"
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

                <p className="text-slate-400 text-xs font-semibold mb-1 uppercase">
                  Output
                </p>
                <div>{renderValue(el.output)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">
            No test cases available.
          </p>
        )}
      </div>
    </motion.div>
  );
}
