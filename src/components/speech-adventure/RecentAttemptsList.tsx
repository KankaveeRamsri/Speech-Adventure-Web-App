import type { PracticeAttempt } from "@/types/speechAdventure";

interface Props {
  attempts: PracticeAttempt[];
  stageNames?: Record<string, string>;
}

const defaultStageNames: Record<string, string> = {
  pretest: "Pre-test",
  "level-1": "Level 1: Oral Motor",
  "level-2": "Level 2: Sound Familiarity",
  "level-3": "Level 3: Sound Production",
  "level-4": "Level 4: Word Practice",
  "level-5": "Level 5: Sentence Practice",
  review: "Review / Post-test",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function RecentAttemptsList({
  attempts,
  stageNames = defaultStageNames,
}: Props) {
  if (attempts.length === 0) {
    return (
      <div className="bg-surface rounded-3xl p-6 shadow-sm text-center">
        <p className="text-4xl mb-2" aria-hidden="true">📝</p>
        <p className="text-sm text-text-muted">ยังไม่มีประวัติการฝึก</p>
        <p className="text-sm text-text-muted">เริ่มฝึกเลยเพื่อเห็นความก้าวหน้า!</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text mb-4">📝 ประวัติการฝึกล่าสุด</h3>
      <div className="space-y-3">
        {attempts.map((record) => {
          const isPassed = record.score >= 70;
          return (
            <div
              key={record.id}
              className="flex items-center gap-4 bg-bg rounded-2xl p-4"
            >
              {/* Status Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  isPassed ? "bg-success/15" : "bg-secondary/15"
                }`}
                aria-hidden="true"
              >
                {isPassed ? "✅" : "🔄"}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-text text-sm truncate">
                    {record.promptText}
                  </p>
                  <div className="flex items-center gap-0.5 text-secondary text-sm ml-2 flex-shrink-0">
                    {"★".repeat(record.starsEarned)}
                    <span className="text-text-muted text-xs ml-1">
                      ({record.score}%)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {stageNames[record.stageId] ?? record.stageId} · {formatDate(record.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
