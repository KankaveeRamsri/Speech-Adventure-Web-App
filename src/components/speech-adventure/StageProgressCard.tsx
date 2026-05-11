import type { StageStatus } from "@/types/speechAdventure";

interface Props {
  stageName: string;
  stageIcon: string;
  accentColor: string;
  status: StageStatus;
  starsEarned: number;
  starsTotal: number;
}

export default function StageProgressCard({
  stageName,
  stageIcon,
  accentColor,
  status,
  starsEarned,
  starsTotal,
}: Props) {
  const percent =
    starsTotal > 0 ? Math.round((starsEarned / starsTotal) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xl w-8 text-center" aria-hidden="true">
        {status === "locked" ? "🔒" : stageIcon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-text truncate">
            {stageName}
          </span>
          <span className="text-xs text-text-muted ml-2 flex-shrink-0">
            {starsEarned}/{starsTotal} ⭐
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              backgroundColor:
                status === "locked" ? "#B2BEC3" : accentColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
