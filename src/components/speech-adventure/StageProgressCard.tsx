import type { StageStatus } from "@/types/speechAdventure";

interface Props {
  stageName: string;
  stageIcon: string;
  accentColor: string;
  status: StageStatus;
  starsEarned: number;
  starsTotal: number;
  attemptCount?: number;
  bestScore?: number;
  latestScore?: number;
}

const STATUS_BADGE: Record<
  StageStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  completed: {
    label: "✓ เสร็จแล้ว",
    bgClass: "bg-success/15",
    textClass: "text-success",
  },
  current: {
    label: "กำลังฝึก",
    bgClass: "bg-primary/15",
    textClass: "text-primary",
  },
  review: {
    label: "ทบทวน",
    bgClass: "bg-level-pretest/20",
    textClass: "text-level-pretest",
  },
  locked: {
    label: "ล็อค",
    bgClass: "bg-gray-100",
    textClass: "text-text-muted",
  },
};

export default function StageProgressCard({
  stageName,
  stageIcon,
  accentColor,
  status,
  starsEarned,
  starsTotal,
  attemptCount,
  bestScore,
  latestScore,
}: Props) {
  const cappedStars = Math.min(starsEarned, starsTotal);
  const percent = starsTotal > 0 ? Math.round((cappedStars / starsTotal) * 100) : 0;
  const isLocked = status === "locked";
  const badge = STATUS_BADGE[status];
  const hasStats = !isLocked && attemptCount !== undefined && attemptCount > 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-3 transition-opacity ${
        isLocked ? "opacity-50" : "bg-bg"
      }`}
    >
      {/* Stage Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{
          backgroundColor: isLocked ? "#F3F4F6" : `${accentColor}20`,
        }}
        aria-hidden="true"
      >
        {isLocked ? "🔒" : stageIcon}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Name + Status Badge */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold text-text truncate">
            {stageName}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bgClass} ${badge.textClass}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Stats row: attempt count + scores */}
        {hasStats && (
          <div className="flex items-center gap-3 mb-1.5 text-xs text-text-muted">
            <span>{attemptCount} ครั้ง</span>
            {typeof bestScore === "number" && (
              <span>สูงสุด {bestScore}%</span>
            )}
            {typeof latestScore === "number" &&
              latestScore !== bestScore && (
                <span>ล่าสุด {latestScore}%</span>
              )}
          </div>
        )}

        {/* Stars Progress Bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              backgroundColor: isLocked ? "#B2BEC3" : accentColor,
            }}
          />
        </div>
      </div>

      {/* Stars Count */}
      <div className="flex-shrink-0 text-xs text-text-muted text-right min-w-[36px]">
        {cappedStars}/{starsTotal}
        <span className="ml-0.5">⭐</span>
      </div>
    </div>
  );
}
