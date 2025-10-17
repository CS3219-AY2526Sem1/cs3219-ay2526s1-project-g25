"use client";

import ChatPane from "@/components/collab/ChatPane";
import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";
import {useEffect, useState} from "react";

export default function CollabPage() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [sessionId, setSessionId] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
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

    // TEMPORARY: Used for getting the details needed to connect to WebSocket, which Matching Service should provide.
    useEffect(() => {
        // Ask for temporary IDs via dialog boxes.
        const sId = prompt("Enter session ID:") || "";
        const uId = prompt("Enter user ID:") || "";
        setSessionId(sId);
        setUserId(uId);

        if (!sId || !uId) { return; }

        const wsUrl = `ws://localhost:3004/ws?sessionId=${encodeURIComponent(sId)}&userId=${encodeURIComponent(uId)}`;
            console.log(wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log(`Connected to websocket server at ${wsUrl}`);
            setConnected(true);
        }

        ws.onmessage = (event) => {
            setMessages((prevMessages) => {
                return [...prevMessages, event.data]
            })
        }

        ws.onclose = () => {
            console.log("Disconnected.");
            setConnected(false);
        }

        ws.onerror = (err) => {
            console.error("Websocket Error:", err);
        }
        
        setSocket(ws);

        // Cleanup on unmount
        return () => ws.close();
    }, []);

    return (
        <div className="h-screen flex flex-row">
            <QuestionPane question={question}/>
            <div className="w-1/3 flex flex-col">
                <CodePane/>
                <ExecutionPane/>
            </div>
            <ChatPane/>
        </div>
    )
}
