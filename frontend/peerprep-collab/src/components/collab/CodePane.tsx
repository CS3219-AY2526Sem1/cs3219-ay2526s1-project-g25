export default function CodePane() {
    return (
        <div className="w-full h-3/4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-y-scroll">
            <div className="w-full flex flex-row p-4 justify-between items-center mb-4">
                <select name="language" id="language" className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option value="Python">Python</option>
                    <option value="C">C</option>
                    <option value="C++">C++</option>
                    <option value="Java">Java</option>
                    <option value="Javascript">Javascript</option>
                </select>
                <button className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition">Run Code</button>
            </div>
            <textarea className="w-full h-full p-4 text-gray-700 font-mono"></textarea>
        </div>
    );
}
