import type { PracticeAttempt } from "@/types/speechAdventure";

interface Props {
  attempt: PracticeAttempt;
  accentColor: string;
}

export default function SessionSummaryCard({ attempt, accentColor }: Props) {
  return (
    <div
      className="rounded-3xl p-5 shadow-sm border-2 animate-slide-up"
      style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}05` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl" aria-hidden="true">💾</span>
        <p className="font-bold text-text">บันทึกผลการฝึกแล้ว!</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-surface rounded-2xl p-3 text-center">
          <p className="text-xs text-text-muted mb-1">คะแนน</p>
          <p className="text-xl font-bold" style={{ color: accentColor }}>
            {attempt.score}
          </p>
        </div>
        <div className="bg-surface rounded-2xl p-3 text-center">
          <p className="text-xs text-text-muted mb-1">ดาวที่ได้</p>
          <div className="flex justify-center gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`text-lg ${i < attempt.starsEarned ? "text-secondary" : "text-gray-300"}`}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-text-muted text-center">
        {attempt.status === "passed"
          ? "เก่งมาก! ความพยายามของคุณกำลังเติบโต!"
          : attempt.status === "almost"
          ? "ดีขึ้นแล้ว! ลองอีกสักหน่อยนะ!"
          : "สู้ต่อนะ! การฝึกฝนทำให้เก่งขึ้น!"}
      </p>
    </div>
  );
}
