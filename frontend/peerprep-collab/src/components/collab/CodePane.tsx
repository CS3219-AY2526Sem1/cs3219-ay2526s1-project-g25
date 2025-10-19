"use client";

import { motion } from "framer-motion";
import { Play, Code2 } from "lucide-react";
import { useEffect, useState } from "react";
import { executeCode } from "@/lib/collabApi";
import { useCollabStore } from "@/lib/collabStore";
import { getParams } from "@/lib/helpers";
import {connectCollabSocket} from "@/lib/collabSocket";

// Returns the diff index between two strings, used for updating text via websocket.
function findDiffIndex(str1: string, str2: string): number {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] == str2[i]) { i++; }
    return i;
}

export default function CodePane() {
    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState("");
    const [docVersion, setDocVersion] = useState(0);
    const [sendMsg, setSendMsg] = useState<(data: any) => void>(() => () => {})
    const { setOutput, setTests } = useCollabStore();

    const { userId, sessionId } = getParams();


    const boilerplates: Record<string, string> = {
        python: `def solve():\n    # write your code here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
        "c++": `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    // write code here\n    return 0;\n}`,
        java: `class Main {\n    public static void main(String[] args) {\n        // write code here\n    }\n}`,
        javascript: `function solve(){\n  // write code here\n}\nsolve();`,
    };

    useEffect(() => {
        setCode(boilerplates[language]);

        const { send } = connectCollabSocket(sessionId, userId, (msg) => {
            console.log(msg);
            // We don't need to reload the entire textarea if the change is caused by us.
            if (msg?.by === userId) { return; }
            if (msg.type === "doc:applied" || msg.type === "doc:resync") {
                console.log("CCC");
                setCode(msg.document.text);
                setDocVersion(msg.document.version);
            }
        })

        setSendMsg(() => send);
    }, [language]);

    const getCaretPosition = (textarea: HTMLElement) => {
        if (textarea.selectionStart || textarea.selectionStart === 0) {
            return textarea.selectionStart;
        }
        return 0;
    }

    const handleCodeChanged = (e) => {
        const codeTextarea = e.target;

        console.log("code changed!")
        console.log(getCaretPosition(codeTextarea));
        sendMsg({
            "type": "doc:op",
            "op": {
                "type": "insert",
                "index": 0,
                "text": "HELLO",
                "version": docVersion
            }
        });

        // TODO: Insert text only for now.
        //const newText = e.target.value;
        //const oldText = collabRef?.current?.getText() || "";

        //// Find diff index (naively)
        //const diffIndex = findDiffIndex(oldText, newText);
        //const insertedText = newText.slice(diffIndex, diffIndex + (newText.length - oldText.length));

        //const currentVersionNumber = (collabRef?.current?.getVersion() || 0);
        setCode(e.target.value);
        setDocVersion((docVersion) => docVersion + 1);
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
                      onChange={(e) => setLanguage(e.target.value.toLowerCase())}
                      className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
                  >
                      <option value="python">Python</option>
                      <option value="c++">C++</option>
                      <option value="java">Java</option>
                      <option value="javascript">Javascript</option>
                  </select>
              </div>
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRun}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all flex items-center gap-2"
              >
                  <Play className="w-4 h-4" />
                  Run Code
              </motion.button>
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

