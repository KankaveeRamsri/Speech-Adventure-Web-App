import type { PracticeAttempt } from "@/types/speechAdventure";

interface Props {
  attempt: PracticeAttempt;
  accentColor: string;
}

export default function SessionSummaryCard({ attempt, accentColor }: Props) {
  const statusMessage =
    attempt.status === "passed"
      ? "ยอดเยี่ยม! บันทึกผลสำเร็จแล้ว"
      : attempt.status === "almost"
      ? "ดีขึ้นแล้ว! บันทึกผลเรียบร้อย"
      : "บันทึกผลแล้ว สู้ต่อนะ!";

  return (
    <div
      className="rounded-xl p-4 border animate-slide-up"
      style={{
        borderColor: `${accentColor}25`,
        backgroundColor: `${accentColor}06`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <p className="font-semibold text-text text-sm">{statusMessage}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface dark:bg-white/5 rounded-xl p-3 text-center border border-border">
          <p className="text-xs text-text-muted mb-1">คะแนน</p>
          <p className="text-2xl font-bold leading-none" style={{ color: accentColor }}>
            {attempt.score}
            <span className="text-sm font-medium ml-0.5">%</span>
          </p>
        </div>
        <div className="bg-surface dark:bg-white/5 rounded-xl p-3 text-center border border-border">
          <p className="text-xs text-text-muted mb-1">ดาวที่ได้</p>
          <div className="flex justify-center gap-0.5 mt-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`text-xl leading-none ${i < attempt.starsEarned ? "text-secondary" : "text-disabled dark:text-white/15"}`}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
