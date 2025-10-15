import TagPill from "./TagPill"
import TestCase from "./TestCase"

export default function QuestionPane() {
    const test_cases = {
        "cases": [
            {
                "input": "[1, 9, 3]",
                "output": "9"
            },
            {
                "input": "[5, 2, 8]",
                "output": "8"
            }
        ]
    }

    const question_title = "Find Maximum Element";
    const question_description = "Find the largest element given an array.";
    const difficulty = "easy";
    const topic = "Graphs";

    return (
        <div className="w-1/3 h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-y-scroll">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{question_title}</h2>
            <div className="flex flex-wrap mb-4">
                <TagPill label={difficulty} isDifficulty={true}/>
                <TagPill label={topic} isDifficulty={false}/>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">{question_description}</p>
            <img className="rounded-lg mb-5 w-full object-cover" alt="Question Image" src="https://picsum.photos/200"></img>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Cases</h3>
            { (test_cases["cases"] || []).map((el) => 
                <TestCase key={el.input} input={el.input} output={el.output}/>
            )}
        </div>
    )
}
