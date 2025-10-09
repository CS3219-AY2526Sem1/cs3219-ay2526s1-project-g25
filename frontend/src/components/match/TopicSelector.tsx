"use client"

export default function TopicSelector({
  selected,
  setSelected,
  disabled = false,
}: {
  selected: string[]
  setSelected: (topics: string[]) => void
  disabled?: boolean
}) {
  const topics = [
    "Arrays",
    "LinkedList",
    "Binary Tree",
    "Graphs",
    "Dynamic Programming",
    "Trees",
    "Greedy",
    "Two Pointers",
    "Sorting",
    "Recursion",
  ]

  function toggleTopic(t: string) {
    if (disabled) return
    setSelected(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t])
  }

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {topics.map((t) => (
        <button
          key={t}
          onClick={() => toggleTopic(t)}
          disabled={disabled}
          className={`px-4 py-2.5 rounded-xl transition-all duration-300 border font-medium text-sm ${
            selected.includes(t)
              ? // White text on purple background for selected topics
                "bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/40 scale-105"
              : // Light text on dark background for unselected topics
                "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-purple-500 hover:text-purple-300 hover:bg-slate-800 hover:shadow-md hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
