
"use client";

import { motion } from "framer-motion";
import { Play, Code2, TestTube, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { executeCode } from "@/lib/collabApi";
import { useCollabStore } from "@/lib/collabStore";
import { getParams } from "@/lib/helpers";
import {connectCollabSocket} from "@/lib/collabSocket";
import { diffChars } from "diff";
import MonacoEditor from "./MonacoEditor";

import * as Y from "yjs";


export default function CodePane({ question }: { question: any }) {
    const [language, setLanguage] = useState("python");
    // const [isDocInitialized, setDocInitialized] = useState(false);
    const [code, setCode] = useState("");
    // const [docVersion, setDocVersion] = useState(0);
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
        setCurrentLanguage 
    } = useCollabStore();

    const { userId, sessionId } = getParams();

    const yDocRef = useRef<Y.Doc | null>(null);
    const yTextRef = useRef<Y.Text | null>(null);
    const wsRef = useRef<WebSocket | null>(null);


    // Map your language values to Monaco Editor language IDs
    const getMonacoLanguage = (lang: string): string => {
        const langMap: Record<string, string> = {
            'python': 'python',
            'javascript': 'javascript',
            'typescript': 'typescript',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'csharp': 'csharp',
            'go': 'go',
            'rust': 'rust',
            'php': 'php',
            'ruby': 'ruby',
            'swift': 'swift',
            'kotlin': 'kotlin',
            'scala': 'scala',
            'perl': 'perl',
            'r': 'r',
            'dart': 'dart',
            'lua': 'lua',
            'haskell': 'haskell',
            'clojure': 'clojure',
            'elixir': 'elixir',
            'julia': 'julia',
            'fsharp': 'fsharp',
            'vbnet': 'vb',
            'bash': 'shell',
            'pascal': 'pascal',
            'sql': 'sql',
        };
        return langMap[lang] || 'plaintext';
    };

    const languageOptions = [
        { value: 'python', label: 'Python 3' },
        { value: 'javascript', label: 'JavaScript (Node.js)' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'java', label: 'Java' },
        { value: 'c', label: 'C (GCC)' },
        { value: 'cpp', label: 'C++ (GCC)' },
        { value: 'csharp', label: 'C#' },
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
        { value: 'julia', label: 'Julia' },
        { value: 'fsharp', label: 'F#' },
        { value: 'vbnet', label: 'VB.NET' },
        { value: 'bash', label: 'Bash' },
        { value: 'pascal', label: 'Pascal' },
        { value: 'sql', label: 'SQL' },
    ];



    useEffect(() => {
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
                    setCode(""); // Clear code when language changes
                    setLanguageChangeUser(msg.userId);
                    
                    // Clear the indicator after 3 seconds
                    setTimeout(() => {
                        setLanguageChangeUser(null);
                    }, 3000);
                }
                return;
            }

        //     // Handle document initialization
        //     if (msg.type === "init") {
        //         console.log("[CodePane] Received init message:", msg.document);
        //         if (!isDocInitialized) {
        //             console.log("[CodePane] Initializing with document content:", msg.document.text);
        //             setCode(msg.document.text || "");
        //             setDocVersion(msg.document.version);
        //             setDocInitialized(true);
        //         }
        //         return;
        //     }

        //     // Handle document sync updates (for real-time collaboration)
        //     if (msg.type === "doc:applied" || msg.type === "doc:resync") {
        //         console.log("[CodePane] Document sync update:", msg.document);
        //         // We don't need to reload if the change is caused by us
        //         if (msg?.by === userId) { 
        //             console.log("[CodePane] Ignoring our own change");
        //             return; 
        //         }
                
        //         setCode(msg.document.text);
        //         setDocVersion(msg.document.version);
        //         return;
        //     }
            }
        );

        setSendMsg(() => send);
        setExecuteTestCases(() => executeTestCases);
    }, [language, sessionId, userId, setCurrentLanguage, setIsExecutingTests, setTestExecutionResults, setOutput]);

    useEffect(() => {
        if (!sessionId || !userId) return;
        if (typeof window === "undefined") return; // SSR guard

        const ydoc = new Y.Doc();
        const ytext = ydoc.getText("code");
        yDocRef.current = ydoc;
        yTextRef.current = ytext;

        const base = process.env.NEXT_PUBLIC_YJS_WS_URL ?? "ws://localhost:3004/ws-yjs";
        const wsUrl = `${base}?${new URLSearchParams({ sessionId, userId })}`;
        const ws = new window.WebSocket(wsUrl);
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        ws.onopen = () => console.log("[Yjs] Connected", wsUrl);

        ws.onmessage = (evt) => {
            const update = new Uint8Array(evt.data as ArrayBuffer);
            Y.applyUpdate(ydoc, update);
        };

        // Type signature matches Y.Doc 'update' event
        const onUpdate = (update: Uint8Array, _origin: unknown, _doc: Y.Doc) => {
            const sock = wsRef.current;
            if (sock && sock.readyState === WebSocket.OPEN) {
            sock.send(update);
            }
        };
        ydoc.on("update", onUpdate);

        const onY = () => setCode(ytext.toString());
        ytext.observe(onY);

        return () => {
            try { ytext.unobserve(onY); } catch {}
            try { ydoc.off("update", onUpdate); } catch {}
            try { wsRef.current?.close(); } catch {}
            wsRef.current = null;
            yDocRef.current = null;
            yTextRef.current = null;
        };
    }, [sessionId, userId]);


    const handleCodeChanged = (newCode: string) => {
        setCode(newCode); // update Monaco immediately for responsiveness

        const ydoc = yDocRef.current;
        const ytext = yTextRef.current;
        if (!ydoc || !ytext) return;

        const oldV = ytext.toString();
        if (oldV === newCode) return;

        // naive replace-all (works; optimize later if needed)
        ydoc.transact(() => {
        ytext.delete(0, oldV.length);
        ytext.insert(0, newCode);
        });
        // Yjs will emit an update; our adapter sends it to the server,
        // and peers receive/apply it. No manual doc:op needed.
    };

    async function handleRun() {
        try {
            console.log("[CodePane] handleRun() called:", { sessionId, language });
            setOutput("Running...");
            setTests([]);
            //const res = await executeCode(sessionId, code, language);
            const payload = await executeCode(sessionId, code, language);
            //console.log("[CodePane] Received response:", res);
            const run = (payload && payload.run) ? payload.run : payload;
            //const out =
                //res?.run?.output || res.output || res.stderr || "[NO OUTPUT]";
            const out =
                (run.output != null && String(run.output).trim() !== "" ? run.output : null) ??
                (run.error  != null && String(run.error ).trim() !== "" ? run.error  : null) ??
                "[NO OUTPUT]";
            setOutput(out);

            console.log("[CodePane] REST execute payload:", payload);

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
            console.error("[CodePane] handleRun failed:", e);
            setOutput("Execution failed: " + e.message);
            setTests([]);
        }
    }

    // async function handleRun() {
    //     try {
    //         console.log("[CodePane] Sending run:execute message via WebSocket");
    //         setOutput("Running...");
    //         setTests([]);

    //         sendMsg({
    //         type: "run:execute",
    //         userId,
    //         sessionId,
    //         language,
    //         });
    //     } catch (e) {
    //         console.error("[CodePane] handleRun failed:", e);
    //         setOutput("Execution failed: " + String(e));
    //     }
    // }

    // Extract test cases from question data
    const extractTestCases = (question: any) => {
        if (!question?.test_cases) return [];
        
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
        if (!customInput.trim()) {
            console.warn("[CodePane] No custom input provided");
            return;
        }

        try {
            setOutput("Running with custom input...");
            setTests([]);

            // Broadcast to others
            sendMsg({
                type: "customInput:update",
                customInput,
                userId
            });

            // Use executeCode API and pass stdin
            const res = await executeCode(sessionId, code, language);

            const out = res?.run?.output || res.output || res.stderr || "[NO OUTPUT]";

            setOutput(`Custom Input:\n${customInput}\n\nOutput:\n${out}`);
        } catch (e: any) {
            console.error("[CodePane] Custom input execution failed:", e);
            setOutput("Execution failed: " + e.message);
        }
    }



  return (
      <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full w-full bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden flex flex-col"
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
                           // Don't clear code when user changes language - preserve existing content
                           
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
                      onClick={handleRunTests}
                      disabled={isExecutingTests || extractTestCases(question).length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isExecutingTests ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                          <TestTube className="w-4 h-4" />
                      )}
{(() => {
                          if (isExecutingTests) return "Testing...";
                          if (extractTestCases(question).length === 0) return "No Tests";
                          return "Run Tests";
                      })()}
                  </motion.button>
              </div>
          </div>

          {/* Custom Input Section */}
          {/* <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800/30">
              <div className="flex items-center gap-3">
                  <label htmlFor="custom-input" className="text-sm font-medium text-slate-300">Custom Input:</label>
                  <input
                      id="custom-input"
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
          </div> */}

          {/* Code Editor */}
          <div className="flex-1 p-6 bg-slate-950">
              <div className="w-full h-full rounded-lg border border-slate-700/50 overflow-hidden">
                  <MonacoEditor
                      value={code}
                      onChange={handleCodeChanged}
                      language={getMonacoLanguage(language)}
                  />
              </div>
          </div>
      </motion.div>
  );
}
