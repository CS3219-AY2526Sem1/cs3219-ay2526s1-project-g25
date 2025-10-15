export default function TagPill({ label, isDifficulty = false }) {
    const base = "inline-block px-3 py-1 text-xs font-semibold rounded-full mr-2 mb-2";
    let colors = "bg-blue-100 text-blue-700";

    if (isDifficulty) {
        const difficultyColors = {
            easy: "bg-green-100 text-green-700",
            medium: "bg-yellow-100 text-yellow-700",
            hard: "bg-red-100 text-red-700"
        }

        colors = difficultyColors[label] || "bg-gray-100 text-gray-700";
    }

    return <span className={`${base} ${colors}`}>{label}</span>
}
