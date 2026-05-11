"use client";

import Link from "next/link";
import type { PracticeAttempt, TrainingStage } from "@/types/speechAdventure";

interface Props {
  attempts: PracticeAttempt[];
  stage: TrainingStage;
  totalMissions: number;
  onRetry: () => void;
}

function getEncouragingMessage(avgScore: number): string {
  if (avgScore >= 85) return "ยอดเยี่ยมมาก! น้องเก่งมากๆ เลย สุดยอดเลย!";
  if (avgScore >= 70) return "ดีมากเลย! น้องพัฒนาได้ดีมาก ภูมิใจในตัวเองได้เลย!";
  if (avgScore >= 55) return "ดีนะ! การฝึกทุกวันทำให้น้องเก่งขึ้นแน่นอน!";
  return "สู้ต่อนะ! ฝึกบ่อยๆ จะเก่งขึ้นทุกวันเลย!";
}

function getTrophyEmoji(avgScore: number): string {
  if (avgScore >= 85) return "🏆";
  if (avgScore >= 70) return "🌟";
  if (avgScore >= 55) return "💪";
  return "🌈";
}

function computeStarRating(totalStars: number, totalMissions: number): number {
  const maxStars = totalMissions * 3;
  if (maxStars === 0) return 0;
  return Math.round((totalStars / maxStars) * 3);
}

export default function LevelCompletionSummary({
  attempts,
  stage,
  totalMissions,
  onRetry,
}: Props) {
  const avgScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
        )
      : 0;
  const totalStars = attempts.reduce((sum, a) => sum + a.starsEarned, 0);
  const uniqueMissions = new Set(attempts.map((a) => a.practiceItemId)).size;
  const filledStars = computeStarRating(totalStars, totalMissions);

  return (
    <div className="animate-bounce-in space-y-4">
      {/* Main celebration card */}
      <div
        className="bg-surface rounded-3xl p-8 shadow-sm text-center"
        style={{ borderTop: `4px solid ${stage.accentColor}` }}
      >
        {/* Trophy */}
        <p className="text-7xl mb-4" aria-hidden="true">
          {getTrophyEmoji(avgScore)}
        </p>
        <h2 className="text-2xl font-bold text-text mb-1">
          {stage.name} สำเร็จแล้ว!
        </h2>
        <p className="text-text-muted text-base leading-relaxed mb-6">
          {getEncouragingMessage(avgScore)}
        </p>

        {/* Star rating */}
        <div
          className="flex justify-center gap-3 mb-6"
          aria-label={`ได้รับ ${filledStars} ดาวจาก 3 ดาว`}
        >
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`text-5xl transition-all duration-300 ${
                n <= filledStars ? "drop-shadow-md" : "opacity-20"
              }`}
              aria-hidden="true"
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-bg rounded-2xl p-4">
            <p className="text-2xl font-bold text-primary">
              {uniqueMissions}/{totalMissions}
            </p>
            <p className="text-xs text-text-muted mt-1">ภารกิจสำเร็จ</p>
          </div>
          <div className="bg-bg rounded-2xl p-4">
            <p className="text-2xl font-bold text-success">{avgScore}%</p>
            <p className="text-xs text-text-muted mt-1">คะแนนเฉลี่ย</p>
          </div>
          <div className="bg-bg rounded-2xl p-4">
            <p className="text-2xl font-bold text-secondary">⭐ {totalStars}</p>
            <p className="text-xs text-text-muted mt-1">ดาวที่ได้รับ</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Link
          href="/training"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md"
        >
          🗺️ กลับแผนที่การฝึก
        </Link>
        <Link
          href="/progress"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all active:scale-[0.98]"
        >
          📊 ดูความก้าวหน้า
        </Link>
        <button
          onClick={onRetry}
          className="w-full py-3 rounded-2xl text-text-muted font-medium hover:bg-surface transition-all active:scale-[0.98]"
        >
          🔄 ฝึกซ้ำอีกครั้ง
        </button>
      </div>
    </div>
  );
}
