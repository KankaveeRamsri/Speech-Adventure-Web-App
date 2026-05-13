import type { EvaluationResult } from "@/types/speechAdventure";

interface Props {
  result: EvaluationResult;
  accentColor: string;
}

export default function EvaluationResultCard({ result, accentColor }: Props) {
  const percentage = Math.round((result.score / result.maxScore) * 100);
  const passColor = result.isPassed ? "#4CAF82" : "#FF6B6B";
  const circumference = 2 * Math.PI * 36;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="bg-surface border-2 rounded-xl p-5" style={{ borderColor: `${accentColor}30` }}>
      <div className="flex items-center gap-5">
        {/* Score ring */}
        <div className="relative flex-shrink-0 w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" stroke="#E2E8F0" strokeWidth="6" fill="none" className="dark:stroke-white/10" />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke={passColor}
              strokeWidth="6"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            style={{ color: passColor }}
          >
            {percentage}%
          </span>
        </div>

        {/* Stars + message */}
        <div className="flex-1">
          <div className="flex items-center gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-lg leading-none ${i < result.stars ? "text-secondary" : "text-disabled dark:text-white/15"}`}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
            <span className="text-xs text-text-muted ml-1">({result.stars}/5)</span>
          </div>
          <p className="font-semibold text-sm" style={{ color: accentColor }}>
            {result.message}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {result.isPassed ? "ผ่านเกณฑ์แล้ว" : "ลองอีกครั้งได้เลย"}
          </p>
        </div>
      </div>
    </div>
  );
}
