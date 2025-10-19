"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import {createCollabManager} from "@/lib/collab/collabManager";
import {useEffect, useRef, useState} from "react";
import { motion } from "framer-motion"

export default function CollabPage() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);

    // TEMPORARY: Question Data.
    const question = {
        title: "Find Maximum Element",
        description: "Find the largest element given an array.",
        difficulty: "easy",
        topic: "Graphs",
        test_cases: [
            {
                "input": "[1, 9, 3]",
                "output": "9"
            },
            {
                "input": "[5, 2, 8]",
                "output": "8"
            }
        ],
        imageUrl: "https://picsum.photos/200"
    }

    return (
        <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-row gap-4">
                <QuestionPane question={question}/>
                <div className="w-1/3 flex flex-col gap-4">
                    <CodePane />
                    <ExecutionPane />
                </div>
                <ChatPane />
            </motion.div>
        </div>
    )
}
