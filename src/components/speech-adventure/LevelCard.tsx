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

  const cardBase = "relative bg-surface rounded-3xl p-5 shadow-sm transition-all duration-200";
  const cardState = isLocked
    ? "opacity-60 grayscale"
    : isCurrent
    ? `hover:shadow-lg hover:-translate-y-1`
    : isCompleted
    ? "hover:shadow-lg hover:-translate-y-1"
    : "hover:shadow-lg hover:-translate-y-1";

  const buttonLabel = isCompleted
    ? "ทบทวน"
    : isCurrent
    ? stage.starsEarned > 0
      ? "ฝึกต่อ"
      : "เริ่มฝึก"
    : "ล็อค";
  const buttonIcon = isCompleted ? "🔄" : isCurrent ? "▶️" : "🔒";

  return (
    <div
      className={`${cardBase} ${cardState}${isCurrent ? ` ring-2 ring-offset-2` : ""}`}
      style={isCurrent ? { "--tw-ring-color": stage.accentColor } as React.CSSProperties : undefined}
    >
      {/* Step number connector */}
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${stage.accentColor}20` }}
          aria-hidden="true"
        >
          {isLocked ? "🔒" : stage.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: stage.accentColor }}
            >
              {index + 1}/7
            </span>
            {isCompleted && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success text-white">
                ✓ เสร็จแล้ว
              </span>
            )}
            {isCurrent && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-white animate-pulse-gentle">
                กำลังฝึก
              </span>
            )}
          </div>

          <h3 className="font-bold text-text text-base leading-snug">
            {stage.name}
          </h3>
          <p className="text-sm text-text-muted mt-0.5">{stage.shortGoal}</p>

          {/* Stars */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: stage.starsTotal }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${i < stage.starsEarned ? "text-secondary" : "text-gray-300"}`}
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
      <div className="mt-4">
        {isLocked ? (
          <button
            disabled
            className="w-full py-2.5 rounded-2xl bg-gray-100 text-text-muted font-semibold text-sm cursor-not-allowed"
          >
            {buttonIcon} {buttonLabel}
          </button>
        ) : (
          <Link
            href={`/training/${stage.slug}`}
            className="block w-full text-center py-2.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
            style={{
              backgroundColor: isCurrent ? stage.accentColor : `${stage.accentColor}15`,
              color: isCurrent ? "#fff" : stage.accentColor,
            }}
          >
            {buttonIcon} {buttonLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
