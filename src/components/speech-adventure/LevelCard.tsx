import type { TrainingStage } from "@/types/speechAdventure";
import Link from "next/link";

interface Props {
  stage: TrainingStage;
  index: number;
}

export default function LevelCard({ stage, index }: Props) {
  const isLocked = stage.status === "locked";
  const isCompleted = stage.status === "completed";
  const isCurrent = stage.status === "current";

  return (
    <div
      className={`relative bg-surface border rounded-xl p-4 transition-all duration-200 ${
        isLocked
          ? "opacity-50 border-border"
          : isCurrent
          ? "border-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          : "border-border hover:shadow-md hover:-translate-y-0.5"
      }`}
      style={isCurrent ? { borderColor: stage.accentColor } : undefined}
    >
      {/* Current stage glow overlay in dark mode */}
      {isCurrent && (
        <div
          className="absolute inset-0 rounded-xl opacity-5 dark:opacity-10 pointer-events-none"
          style={{ backgroundColor: stage.accentColor }}
        />
      )}

      <div className="flex items-start gap-3 relative">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ backgroundColor: isLocked ? undefined : `${stage.accentColor}18` }}
          aria-hidden="true"
        >
          {isLocked ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <span className="text-xl">{stage.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* Step indicator */}
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0"
              style={{ backgroundColor: isLocked ? "#94A3B8" : stage.accentColor }}
            >
              {index + 1} / 7
            </span>
            {isCompleted && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success flex-shrink-0">
                สำเร็จแล้ว
              </span>
            )}
            {isCurrent && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full text-white animate-pulse-gentle flex-shrink-0"
                style={{ backgroundColor: stage.accentColor }}
              >
                กำลังฝึก
              </span>
            )}
          </div>

          <h3 className="font-semibold text-text text-sm leading-snug">{stage.name}</h3>
          <p className="text-xs text-text-muted mt-0.5">{stage.shortGoal}</p>

          {/* Stars */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: stage.starsTotal }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < stage.starsEarned ? "text-secondary" : "text-disabled dark:text-white/20"}`}
                  aria-hidden="true"
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-text-muted">
              {stage.starsEarned}/{stage.starsTotal}
            </span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-3 relative">
        {isLocked ? (
          <button
            disabled
            className="w-full py-2 rounded-xl bg-bg dark:bg-white/5 text-text-muted font-medium text-xs cursor-not-allowed border border-border"
          >
            ยังไม่ปลดล็อค
          </button>
        ) : (
          <Link
            href={`/training/${stage.slug}`}
            className="block w-full text-center py-2 rounded-xl font-semibold text-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
            style={{
              backgroundColor: isCurrent ? stage.accentColor : `${stage.accentColor}15`,
              color: isCurrent ? "#fff" : stage.accentColor,
            }}
          >
            {isCompleted ? "ทบทวน" : isCurrent && stage.starsEarned > 0 ? "ฝึกต่อ" : "เริ่มฝึก"}
          </Link>
        )}
      </div>
    </div>
  );
}
