"use client";

import TagPill from "./TagPill";
import TestCase from "./TestCase";
import { motion } from "framer-motion";
import { BookOpen, LogOut} from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuestionPane({ question, sendMsg, sessionId, userId}) {
const router = useRouter();
  if (!question) return null;

  const {
    title = "Untitled Question",
    description = "No description available.",
    difficulty = "unknown",
    topic = "General",
    image_url,
  } = question;

  // ✅ Ensure test_cases is always an array
  let testCases: any[] = [];
  try {
    if (Array.isArray(question.test_cases)) {
      testCases = question.test_cases;
    } else if (typeof question.test_cases === "string") {
      const parsed = JSON.parse(question.test_cases);
      if (Array.isArray(parsed)) {
        testCases = parsed;
      } else if (parsed && Array.isArray(parsed.cases)) {
        // Handle nested structure: {"cases": [{"input": [], "expected": ""}]}
        testCases = parsed.cases.map((testCase: any) => ({
          input: Array.isArray(testCase.input) ? testCase.input.join('\n') : testCase.input,
          output: testCase.expected || testCase.output || ''
        }));
      }
    } else if (question.test_cases && Array.isArray(question.test_cases.cases)) {
      // Handle nested structure from database
      testCases = question.test_cases.cases.map((testCase: any) => ({
        input: Array.isArray(testCase.input) ? testCase.input.join('\n') : testCase.input,
        output: testCase.expected || testCase.output || ''
      }));
    }
  } catch (err) {
    console.warn("[QuestionPane] Failed to parse test_cases:", err);
  }

const handleEndSession = async () => {
  if (!confirm("Are you sure you want to end this session for both users?")) return;

  try {
    console.log("[UI] Ending session...");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_COLLAB_BASE_URL}/sessions/${sessionId}/leave`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }
    );

    const data = await res.json();
    console.log("[UI] Leave response:", data);

    alert("Session ended. Redirecting to dashboard...");
    router.push(process.env.NEXT_PUBLIC_DASHBOARD_URL!);
  } catch (err) {
    console.error("[UI] Failed to end session:", err);
  }
};


  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full w-full bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl overflow-y-auto"
    >

      {/* Header with End Session */}
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
        <TagPill label={difficulty} isDifficulty={true} />
        <TagPill label={topic} isDifficulty={false} />
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
          <div className="space-y-3">
            {testCases.map((el, idx) => (
              <TestCase
                key={el.input || idx}
                input={el.input}
                output={el.output}
                index={idx + 1}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">No test cases available.</p>
        )}
      </div>
    </motion.div>
  );
}
