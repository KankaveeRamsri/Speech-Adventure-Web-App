import type { EvaluationResult } from "@/types/speechAdventure";

interface Props {
  result: EvaluationResult;
  accentColor: string;
}

export default function EvaluationResultCard({ result, accentColor }: Props) {
  const percentage = Math.round((result.score / result.maxScore) * 100);

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm border-2" style={{ borderColor: `${accentColor}30` }}>
      <div className="text-center mb-4">
        <p className="text-sm text-text-muted mb-2">ผลการประเมิน</p>

        {/* Score Circle */}
        <div className="relative inline-flex items-center justify-center w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={result.isPassed ? "#4CAF82" : "#FF6B6B"}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${percentage * 2.51} 251`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-2xl font-bold" style={{ color: result.isPassed ? "#4CAF82" : "#FF6B6B" }}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Stars */}
      <div className="flex justify-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-2xl transition-all ${i < result.stars ? "text-secondary scale-110" : "text-gray-300"}`}
            style={i < result.stars ? { animationDelay: `${i * 0.1}s` } : undefined}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </div>

      {/* Message */}
      <p className="text-center text-lg font-semibold" style={{ color: accentColor }}>
        {result.message}
      </p>
    </div>
  );
}
