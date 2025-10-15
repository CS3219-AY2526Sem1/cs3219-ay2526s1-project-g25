import CodePane from "@/components/collab/CodePane";
import ExecutionPane from "@/components/collab/ExecutionPane";
import QuestionPane from "@/components/collab/QuestionPane";

export default function CollabPage() {
    return (
        <div className="h-screen flex flex-row">
            <QuestionPane/>
            <div className="w-1/3 flex flex-col">
                <CodePane/>
                <ExecutionPane/>
            </div>
        </div>
    )
}
