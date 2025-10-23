"use client";

import { motion } from "framer-motion";
import { Play, Code2, TestTube, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { executeCode } from "@/lib/collabApi";
import { useCollabStore } from "@/lib/collabStore";
import { getParams } from "@/lib/helpers";
import {connectCollabSocket} from "@/lib/collabSocket";
import { diffChars } from "diff";

// Returns the diff index between two strings, used for updating text via websocket.
function findDiffIndex(str1: string, str2: string): number {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] == str2[i]) { i++; }
    return i;
}

export default function CodePane({ question }: { question: any }) {
    const [language, setLanguage] = useState("python");
    const [isDocInitialized, setDocInitialized] = useState(false);
    const [code, setCode] = useState("");
    const [docVersion, setDocVersion] = useState(0);
    const [sendMsg, setSendMsg] = useState<(data: any) => void>(() => () => {})
    const [executeTestCases, setExecuteTestCases] = useState<(language: string, testCases: any[]) => void>(() => () => {})
    const [customInput, setCustomInput] = useState("")
    const [customInputUser, setCustomInputUser] = useState<string | null>(null)
    const [languageChangeUser, setLanguageChangeUser] = useState<string | null>(null)
    const { 
        setOutput, 
        setTests, 
        setTestExecutionResults, 
        isExecutingTests,
        setIsExecutingTests,
        currentLanguage,
        setCurrentLanguage 
    } = useCollabStore();

    const { userId, sessionId } = getParams();


    const boilerplates: Record<string, string> = {
        python: `def solve():\n    # write your code here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
        "c++": `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    // write code here\n    return 0;\n}`,
        java: `class Main {\n    public static void main(String[] args) {\n        // write code here\n    }\n}`,
        javascript: `function solve(){\n  // write code here\n}\nsolve();`,
        typescript: `function solve(): void {\n  // write code here\n}\nsolve();`,
        c: `#include <stdio.h>\nint main() {\n    // write code here\n    return 0;\n}`,
        csharp: `using System;\nclass Program {\n    static void Main() {\n        // write code here\n    }\n}`,
        go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // write code here\n}`,
        rust: `fn main() {\n    // write code here\n}`,
        php: `<?php\n// write code here\n?>`,
        ruby: `# write code here`,
        swift: `import Foundation\n\n// write code here`,
        kotlin: `fun main() {\n    // write code here\n}`,
        scala: `object Main {\n    def main(args: Array[String]): Unit = {\n        // write code here\n    }\n}`,
        perl: `#!/usr/bin/perl\n# write code here`,
        r: `# write code here`,
        dart: `void main() {\n    // write code here\n}`,
        lua: `-- write code here`,
        haskell: `main = do\n    -- write code here`,
        clojure: `;; write code here`,
        elixir: `# write code here`,
        erlang: `% write code here`,
        julia: `# write code here`,
        ocaml: `(* write code here *)`,
        fsharp: `// write code here`,
        vbnet: `Module Module1\n    Sub Main()\n        ' write code here\n    End Sub\nEnd Module`,
        assembly: `; write code here`,
        bash: `#!/bin/bash\n# write code here`,
        basic: `10 REM write code here`,
        fortran: `program main\n    ! write code here\nend program main`,
        pascal: `program main;\nbegin\n    { write code here }\nend.`,
        prolog: `% write code here`,
        sql: `-- write code here`,
    };

    const languageOptions = [
        { value: 'python', label: 'Python 3' },
        { value: 'javascript', label: 'JavaScript (Node.js)' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'java', label: 'Java' },
        { value: 'c', label: 'C (GCC)' },
        { value: 'cpp', label: 'C++ (GCC)' },
        { value: 'csharp', label: 'C# (Mono)' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
        { value: 'php', label: 'PHP' },
        { value: 'ruby', label: 'Ruby' },
        { value: 'swift', label: 'Swift' },
        { value: 'kotlin', label: 'Kotlin' },
        { value: 'scala', label: 'Scala' },
        { value: 'perl', label: 'Perl' },
        { value: 'r', label: 'R' },
        { value: 'dart', label: 'Dart' },
        { value: 'lua', label: 'Lua' },
        { value: 'haskell', label: 'Haskell' },
        { value: 'clojure', label: 'Clojure' },
        { value: 'elixir', label: 'Elixir' },
        { value: 'erlang', label: 'Erlang' },
        { value: 'julia', label: 'Julia' },
        { value: 'ocaml', label: 'OCaml' },
        { value: 'fsharp', label: 'F#' },
        { value: 'vbnet', label: 'VB.NET' },
        { value: 'assembly', label: 'Assembly (NASM)' },
        { value: 'bash', label: 'Bash' },
        { value: 'basic', label: 'BASIC' },
        { value: 'fortran', label: 'Fortran' },
        { value: 'pascal', label: 'Pascal' },
        { value: 'prolog', label: 'Prolog' },
        { value: 'sql', label: 'SQL' },
    ];

    useEffect(() => {
        // Set initial code if empty
        if (!code) {
            setCode(boilerplates[language]);
        }
        setCurrentLanguage(language);

        const { send, executeTestCases } = connectCollabSocket(sessionId, userId, (msg) => {
            console.log("[CodePane] Received message:", msg.type, msg);

            // Handle test execution results - ALWAYS process these
            if (msg.type === "run:testResults") {
                console.log("[CodePane] Test results received:", msg.testResults);
                setTestExecutionResults(msg.testResults.results);
                setIsExecutingTests(false);
                
                // Clear timeout if it exists
                if ((window as any).testTimeoutId) {
                    clearTimeout((window as any).testTimeoutId);
                    (window as any).testTimeoutId = null;
                }
                return;
            }

            // Handle code execution results (both regular and custom input) - ALWAYS process these
            if (msg.type === "run:result") {
                console.log("[CodePane] Code execution result:", msg.run);
                
                // Check if this is a custom input execution (has stdin)
                if (msg.run.stdin && msg.run.stdin.trim() !== "") {
                    console.log("[CodePane] Custom input execution result:", msg.run);
                    setOutput(`Custom Input: ${msg.run.stdin}\nOutput: ${msg.run.output || msg.run.error || "[NO OUTPUT]"}`);
                } else {
                    console.log("[CodePane] Regular code execution result:", msg.run);
                    setOutput(msg.run.output || msg.run.error || "[NO OUTPUT]");
                }
                return;
            }

            // Handle custom input updates from other users - ALWAYS process these
            if (msg.type === "customInput:update") {
                console.log("[CodePane] Custom input update received:", msg.customInput);
                // Don't update if it's from the current user
                if (msg.userId !== userId) {
                    setCustomInput(msg.customInput);
                    setCustomInputUser(msg.userId);
                }
                return;
            }

            // Handle language updates from other users - ALWAYS process these
            if (msg.type === "language:update") {
                console.log("[CodePane] Language update received:", msg.language);
                // Don't update if it's from the current user
                if (msg.userId !== userId) {
                    setLanguage(msg.language);
                    setCode(boilerplates[msg.language]);
                    setLanguageChangeUser(msg.userId);
                    
                    // Clear the indicator after 3 seconds
                    setTimeout(() => {
                        setLanguageChangeUser(null);
                    }, 3000);
                }
                return;
            }

            // Handle document sync - only if not initialized
            if (isDocInitialized) { return; }

            // We don't need to reload the entire textarea if the change is caused by us.
            if (msg?.by === userId) { return; }

            if (msg.type === "init") {
                setCode(msg.document.text);
                setDocVersion(msg.document.version);
            }

            if (msg.type === "doc:applied" || msg.type === "doc:resync") {
                setCode(msg.document.text);
                setDocVersion(msg.document.version);
            }
        })

        setSendMsg(() => send);
        setExecuteTestCases(() => executeTestCases);
    }, [language]);

    const getCaretPosition = (textarea: HTMLTextAreaElement) => {
        if (textarea.selectionStart || textarea.selectionStart === 0) {
            return textarea.selectionStart;
        }
        return 0;
    }

    const handleCodeChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const codeTextarea = e.target;

        // Compare the diff between the old text and the new text.
        var oldCode = code;
        var newCode = e.target.value;

        const diffs = diffChars(oldCode, newCode);

        // Keeps track of the current index of the diff objects we are iterating over.
        let currentIndex = 0;
        diffs.forEach((el: any, index: number) => {
            if (!el.removed && !el.added) {
                currentIndex += el.count;
                return;
            }

            if (el.added) {
                sendMsg({
                    "type": "doc:op",
                    "op": {
                        "type": "insert",
                        "index": currentIndex,
                        "text": el.value,
                        "version": docVersion
                    }
                });
                currentIndex += el.count;

                setDocVersion((docVersion) => docVersion + 1);
                return;
            }

            if (el.removed) {
                sendMsg({
                    "type": "doc:op",
                    "op": {
                        "type": "delete",
                        "index": currentIndex,
                        "length": el.count,
                        "version": docVersion
                    }
                });

                setDocVersion((docVersion) => docVersion + 1);
                return;
            }
        })

        setCode(e.target.value);
    }

    async function handleRun() {
        try {
            setOutput("Running...");
            setTests([]);
            const res = await executeCode(sessionId, code, language);
            const out =
                res?.run?.output || res.output || res.stderr || "[NO OUTPUT]";
            setOutput(out);

            // Optional: Parse JSON test result array if backend returns one
            try {
                const parsed = JSON.parse(out);
                if (Array.isArray(parsed)) {
                    setTests(
                        parsed.map((t) => ({
                            input: t.input,
                            output: t.output,
                            status: t.status,
                        }))
                    );
                }
            } catch {
                setTests([]);
            }
        } catch (e: any) {
            setOutput("Execution failed: " + e.message);
            setTests([]);
        }
    }

    // Extract test cases from question data
    const extractTestCases = (question: any) => {
        if (!question || !question.test_cases) return [];
        
        try {
            let testCases = [];
            
            if (Array.isArray(question.test_cases)) {
                testCases = question.test_cases;
            } else if (typeof question.test_cases === "string") {
                const parsed = JSON.parse(question.test_cases);
                if (Array.isArray(parsed)) {
                    testCases = parsed;
                } else if (parsed && Array.isArray(parsed.cases)) {
                    testCases = parsed.cases;
                }
            } else if (question.test_cases && Array.isArray(question.test_cases.cases)) {
                testCases = question.test_cases.cases;
            }
            
            // Normalize test cases to ensure they have input and output
            return testCases.map((testCase: any) => ({
                input: testCase.input || '',
                output: testCase.output || testCase.expected || ''
            })).filter((tc: any) => tc.input !== '' && tc.output !== '');
            
        } catch (err) {
            console.error("[CodePane] Failed to parse test cases:", err);
            return [];
        }
    };

    async function handleRunTests() {
        try {
            console.log("[CodePane] Starting test execution...");
            setIsExecutingTests(true);
            setTestExecutionResults(null);
            
            // Extract test cases from the question
            const testCases = extractTestCases(question);
            
            if (testCases.length === 0) {
                console.warn("[CodePane] No test cases found in question");
                setIsExecutingTests(false);
                return;
            }
            
            console.log("[CodePane] Executing test cases:", testCases);
            
            // Set a timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                console.warn("[CodePane] Test execution timeout - stopping loading");
                setIsExecutingTests(false);
            }, 30000); // 30 second timeout
            
            // Store timeout ID to clear it when results come back
            (window as any).testTimeoutId = timeoutId;
            
            // Execute test cases via WebSocket using stored function
            try {
                executeTestCases(language, testCases);
            } catch (e) {
                console.error("[CodePane] Failed to send test execution request:", e);
                setIsExecutingTests(false);
                if ((window as any).testTimeoutId) {
                    clearTimeout((window as any).testTimeoutId);
                    (window as any).testTimeoutId = null;
                }
            }
            
        } catch (e: any) {
            console.error("Test execution failed:", e);
            setIsExecutingTests(false);
        }
    }

    async function handleRunWithCustomInput() {
        try {
            if (!customInput.trim()) {
                console.warn("[CodePane] No custom input provided");
                return;
            }
            
            console.log("[CodePane] Running code with custom input:", customInput);
            
            // Broadcast custom input to other users for visibility
            sendMsg({
                type: "customInput:update",
                customInput: customInput,
                userId: userId
            });
            
            // Send custom input execution via WebSocket
            sendMsg({
                type: "run:code",
                language: language,
                stdin: customInput
            });
            
        } catch (e: any) {
            console.error("Custom input execution failed:", e);
        }
    }

  return (
      <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-3/4 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
          {/* Header */}
          <div className="w-full flex flex-row px-6 py-4 justify-between items-center border-b border-slate-700/50 bg-slate-800/50">
              <div className="flex items-center gap-3">
                  <Code2 className="w-5 h-5 text-purple-400" />
                   <select
                       name="language"
                       id="language"
                       value={language}
                       onChange={(e) => {
                           const newLanguage = e.target.value;
                           setLanguage(newLanguage);
                           setCode(boilerplates[newLanguage]);
                           
                           // Broadcast language change to other users
                           sendMsg({
                               type: "language:update",
                               language: newLanguage,
                               userId: userId
                           });
                       }}
                       className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
                   >
                       {languageOptions.map((option) => (
                           <option key={option.value} value={option.value}>
                               {option.label}
                           </option>
                       ))}
                   </select>
                   {languageChangeUser && languageChangeUser !== userId && (
                       <div className="text-xs text-blue-400">
                           Language changed by User {languageChangeUser}
                       </div>
                   )}
               </div>
              <div className="flex items-center gap-3">
                  <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRun}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all flex items-center gap-2"
                  >
                      <Play className="w-4 h-4" />
                      Run Code
                  </motion.button>
                  
                  <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRunTests}
                      disabled={isExecutingTests || extractTestCases(question).length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isExecutingTests ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                          <TestTube className="w-4 h-4" />
                      )}
                      {isExecutingTests ? "Testing..." : 
                       extractTestCases(question).length === 0 ? "No Tests" : 
                       "Run Tests"}
                  </motion.button>
              </div>
          </div>

          {/* Custom Input Section */}
          <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800/30">
              <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-300">Custom Input:</label>
                  <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom input (e.g., '3 5')"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                  <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRunWithCustomInput}
                      disabled={!customInput.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <Play className="w-4 h-4" />
                      Run with Input
                  </motion.button>
              </div>
              {customInputUser && customInputUser !== userId && (
                  <div className="mt-2 text-xs text-purple-400">
                      Last run by User {customInputUser}
                  </div>
              )}
          </div>

          {/* Code Editor */}
          <div className="flex-1 p-6 bg-slate-950">
              <textarea
                  value={code}
                  onChange={handleCodeChanged}
                  className="w-full h-full p-4 bg-slate-900 text-slate-200 font-mono text-sm rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                  placeholder="// Write your code here..."
                  spellCheck={false}
              />
          </div>
      </motion.div>
  );
}

