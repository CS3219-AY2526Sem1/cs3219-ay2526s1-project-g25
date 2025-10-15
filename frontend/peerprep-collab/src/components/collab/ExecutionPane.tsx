export default function ExecutionPane() {
    const getRowColour = (status: string) => {
        switch(status) {
            case "Passed":
                return "bg-green-50 text-green-800 border-green-100";
            case "Failed":
                return "bg-red-50 text-red-800 border-red-100";
            default:
                return "bg-gray-50 text-gray-800 border-gray-100";
        }
    }
    return (
        <div className="w-full h-1/4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-y-auto transition-shadow hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Execution Results</h3>
            <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                    <tr className="text-left text-gray-700 uppercase text-xs">
                        <th className="px-2 py-4 font-semibold">Test Case</th>
                        <th className="px-2 py-4 font-semibold">Result</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className={`border-b ${getRowColour("Passed")} transition hover:scale-[1.01]`}>
                        <td className="py-2 px-4 font-mono">[1, 8, 9]</td>
                        <td className="py-2 px-4 font-medium">Passed</td>
                    </tr>
                    <tr className={`border-b ${getRowColour("Failed")} transition hover:scale-[1.01]`}>
                        <td className="py-2 px-4 font-mono">[5, 8, 2]</td>
                        <td className="py-2 px-4 font-medium">Failed</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
