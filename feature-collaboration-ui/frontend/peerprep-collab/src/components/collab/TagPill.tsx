type TagPillProps = {
  label: string;
  isDifficulty?: boolean;
};

const DIFFICULTY_COLORS: Record<"easy" | "medium" | "hard", string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

export default function TagPill({ label, isDifficulty = false }: TagPillProps) {
  const base = "inline-block px-3 py-1 text-xs font-semibold rounded-full mr-2 mb-2";

  let colors = "bg-blue-100 text-blue-700";
  if (isDifficulty) {
    const key = label.toLowerCase() as keyof typeof DIFFICULTY_COLORS;
    colors = DIFFICULTY_COLORS[key] ?? "bg-gray-100 text-gray-700";
  }

  return <span className={`${base} ${colors}`}>{label}</span>;
}
