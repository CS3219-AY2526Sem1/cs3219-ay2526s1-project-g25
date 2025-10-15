import TagPill from "./TagPill"
import TestCase from "./TestCase"

export default function QuestionPane() {
    // TODO: Topic Tags, Difficulty Tags
    // TODO: Dynamic, add Test Cases
    const test_cases = {
        "cases": [
            {
                "input": "[1, 9, 3]",
                "output": "9"
            }
        ]
    }

    const difficulty = "easy";
    const topic = "Graphs";

    return (
        <div>
            <h2>Question Title</h2>
            <TagPill label={difficulty} isDifficulty={true}/>
            <TagPill label={topic} isDifficulty={false}/>
            <p>Question Description</p>
            <img src="https://picsum.photos/200"></img>

            <p>Test Cases:</p>
            { (test_cases["cases"] || []).map((el) => 
                <TestCase key={el.input} input={el.input} output={el.output}/>
            )}
        </div>
    )
}
