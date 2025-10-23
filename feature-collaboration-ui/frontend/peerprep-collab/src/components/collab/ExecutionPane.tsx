"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Terminal, Clock, Zap, AlertCircle } from "lucide-react";
import { useCollabStore } from "@/lib/collabStore";

export default function ExecutionPane() {
  const { 
    tests, 
    output, 
    testExecutionResults, 
    isExecutingTests 
  } = useCollabStore();

  const getRowColour = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "error":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "passed":
        return "Passed";
      case "failed":
        return "Failed";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-1/4 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 flex items-center gap-2">
        <Terminal className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Execution Results</h3>
      </div>

      {isExecutingTests ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <p className="text-sm">Executing test cases...</p>
          </div>
        </div>
      ) : testExecutionResults ? (
        <div className="flex-1 overflow-y-auto">
          {/* Test Summary */}
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-300">Test Results</h4>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{testExecutionResults.passedTests} passed</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-400" />
                  <span>{testExecutionResults.failedTests} failed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>{testExecutionResults.executionTime}ms</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(testExecutionResults.passedTests / testExecutionResults.totalTests) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Test Cases Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80 sticky top-0 z-10">
                <tr className="text-left text-slate-400 uppercase text-xs">
                  <th className="px-4 py-3 font-semibold">Test #</th>
                  <th className="px-4 py-3 font-semibold">Input</th>
                  <th className="px-4 py-3 font-semibold">Expected</th>
                  <th className="px-4 py-3 font-semibold">Actual</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {testExecutionResults.testResults.map((test, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border-b border-slate-700/30 ${getRowColour(
                      test.status
                    )} transition-all`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-300 text-center">
                      {test.testNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 max-w-xs truncate">
                      {test.input}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 max-w-xs truncate">
                      {test.expectedOutput}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 max-w-xs truncate">
                      {test.actualOutput || test.error}
                    </td>
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      {getIcon(test.status)}
                      <span className="text-xs">{getStatusText(test.status)}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {test.executionTime}ms
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tests.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 sticky top-0 z-10">
              <tr className="text-left text-slate-400 uppercase text-xs">
                <th className="px-6 py-3 font-semibold">Test Case</th>
                <th className="px-6 py-3 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-b border-slate-700/30 ${getRowColour(
                    t.status
                  )} transition-all`}
                >
                  <td className="py-3 px-6 font-mono text-slate-300">
                    {t.input}
                  </td>
                  <td className="py-3 px-6 font-medium flex items-center gap-2">
                    {getIcon(t.status)}
                    {t.status}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 text-slate-300 text-sm font-mono overflow-auto">
          {output || "Run code to see output here..."}
        </div>
      )}
    </motion.div>
  );
}
