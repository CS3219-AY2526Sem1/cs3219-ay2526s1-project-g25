"use client"
import ChatPane from "@/components/collab/ChatPane"
import CodePane from "@/components/collab/CodePane"
import ExecutionPane from "@/components/collab/ExecutionPane"
import QuestionPane from "@/components/collab/QuestionPane"
import { motion } from "framer-motion"

export default function CollabPage() {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-row gap-4">
        <QuestionPane />
        <div className="w-1/3 flex flex-col gap-4">
          <CodePane />
          <ExecutionPane />
        </div>
        <ChatPane />
      </motion.div>
    </div>
  )
}
