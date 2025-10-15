export default function TestCase({input, output}) {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 m-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-sm text-gray-700 space-y-1">
                <div>
                    <span className="font-medium text-blue-600">Input:</span>{" "}
                    <pre className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md font-mono text-sm">
                        {input}
                    </pre>
                </div>
                <div>
                    <span className="font-medium text-green-600">Output:</span>{" "}
                    <pre className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md font-mono text-sm">
                        {output}
                    </pre>
                </div>
            </div>
        </div>
    )
}
