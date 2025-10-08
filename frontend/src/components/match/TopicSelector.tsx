"use client";

export default function TopicSelector({
  selected,
  setSelected,
}: {
  selected: string[];
  setSelected: (topics: string[]) => void;
}) {
  const topics = ["Arrays", "LinkedList", "Binary Tree", "Graphs", "Dynamic Programming"];

  function toggleTopic(t: string) {
    setSelected(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]);
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {topics.map((t) => (
        <button
          key={t}
          onClick={() => toggleTopic(t)}
          className={`px-4 py-2 rounded-xl transition border ${
            selected.includes(t)
              ? "bg-cyan-400 text-black"
              : "border-slate-700 hover:border-slate-400"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
