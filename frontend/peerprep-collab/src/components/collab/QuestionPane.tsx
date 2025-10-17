import TagPill from "./TagPill"
import TestCase from "./TestCase"

export default function QuestionPane({question}) {
    const {title, description, difficulty, topic, test_cases, imageUrl} = question;

    return (
        <div className="w-1/3 h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-y-scroll">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <div className="flex flex-wrap mb-4">
                <TagPill label={difficulty} isDifficulty={true}/>
                <TagPill label={topic} isDifficulty={false}/>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">{description}</p>
            <img className="rounded-lg mb-5 w-full object-cover" alt="Question Image" src={imageUrl}></img>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Cases</h3>
            { (test_cases["cases"] || []).map((el) => 
                <TestCase key={el.input} input={el.input} output={el.output}/>
            )}
        </div>
    )
}
