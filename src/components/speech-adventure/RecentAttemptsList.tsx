import type { PracticeAttempt } from "@/types/speechAdventure";

interface Props {
  attempts: PracticeAttempt[];
  stageNames?: Record<string, string>;
}

const defaultStageNames: Record<string, string> = {
  pretest: "Pre-test",
  "level-1": "Oral Motor",
  "level-2": "Sound Familiarity",
  "level-3": "Sound Production",
  "level-4": "Word Practice",
  "level-5": "Sentence Practice",
  review: "Review",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
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
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text mb-1">ยังไม่มีประวัติการฝึก</p>
        <p className="text-xs text-text-muted">เริ่มฝึกเพื่อเห็นความก้าวหน้าของคุณ</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-base font-semibold text-text mb-4">ประวัติการฝึกล่าสุด</h3>
      <div className="space-y-2">
        {attempts.map((record) => {
          const isPassed = record.score >= 70;
          return (
            <div
              key={record.id}
              className="flex items-center gap-3 bg-bg dark:bg-white/3 rounded-xl px-4 py-3 border border-border"
            >
              {/* Score badge */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isPassed ? "bg-success/12 text-success" : "bg-secondary/12 text-secondary"
                }`}
              >
                {record.score}%
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-text text-sm truncate">{record.promptText}</p>
                  <div className="flex items-center gap-0.5 text-secondary text-sm flex-shrink-0">
                    {"★".repeat(record.starsEarned)}
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
