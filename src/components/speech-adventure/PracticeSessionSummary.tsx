"use client";

import Link from "next/link";
import type { PracticeSession, TrainingStage } from "@/types/speechAdventure";

interface Props {
  session: PracticeSession;
  stage: TrainingStage;
  onRetry: () => void;
}

function getEncouragingText(avgScore: number): string {
  if (avgScore >= 85) return "ยอดเยี่ยมมาก! น้องเก่งเกินคาดเลยค่ะ";
  if (avgScore >= 70) return "ดีมากเลย! น้องพัฒนาได้ดีมากค่ะ";
  if (avgScore >= 55) return "ดีนะ! การฝึกทุกวันทำให้น้องเก่งขึ้นแน่นอนค่ะ";
  return "สู้ต่อนะ! ฝึกบ่อยๆ จะเก่งขึ้นทุกวันเลยค่ะ";
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} วินาที`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds > 0 ? `${minutes} นาที ${seconds} วินาที` : `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours} ชั่วโมง ${remainMinutes} นาที`;
}

function computeFilledStars(totalStars: number, totalMissions: number): number {
  const maxStars = totalMissions * 3;
  if (maxStars === 0) return 0;
  return Math.round((totalStars / maxStars) * 3);
}

export default function PracticeSessionSummary({ session, stage, onRetry }: Props) {
  const filledStars = computeFilledStars(session.starsEarned, session.totalMissions);
  const durationText = session.durationMs ? formatDuration(session.durationMs) : "—";

  return (
    <div className="animate-bounce-in space-y-4">
      {/* ── Main card ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Color accent bar */}
        <div className="h-1" style={{ backgroundColor: stage.accentColor }} />

        <div className="p-8 text-center">
          {/* Stage badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white mb-4"
            style={{ backgroundColor: stage.accentColor }}
          >
            <span aria-hidden="true">{stage.icon}</span>
            {stage.name}
          </div>

          <h2 className="text-2xl font-bold text-text mb-2">สำเร็จแล้ว!</h2>
          <p className="text-text-muted mb-6">{getEncouragingText(session.averageScore)}</p>

          {/* Star rating */}
          <div className="flex justify-center gap-3 mb-8" aria-label={`ได้รับ ${filledStars} ดาวจาก 3 ดาว`}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`text-5xl leading-none transition-all ${
                  n <= filledStars ? "text-secondary" : "text-disabled dark:text-white/15 opacity-60"
                }`}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="bg-bg dark:bg-white/5 rounded-xl p-4 border border-border">
              <p className="text-xl font-bold text-primary leading-none mb-1">
                {session.completedMissions}/{session.totalMissions}
              </p>
              <p className="text-xs text-text-muted">ภารกิจ</p>
            </div>
            <div className="bg-bg dark:bg-white/5 rounded-xl p-4 border border-border">
              <p className="text-xl font-bold text-success leading-none mb-1">
                {session.averageScore}%
              </p>
              <p className="text-xs text-text-muted">คะแนนเฉลี่ย</p>
            </div>
            <div className="bg-bg dark:bg-white/5 rounded-xl p-4 border border-border">
              <p className="text-xl font-bold text-secondary leading-none mb-1">
                ★ {session.starsEarned}
              </p>
              <p className="text-xs text-text-muted">ดาวรวม</p>
            </div>
            <div className="bg-bg dark:bg-white/5 rounded-xl p-4 border border-border">
              <p className="text-lg font-bold text-info leading-none mb-1">
                {durationText}
              </p>
              <p className="text-xs text-text-muted">เวลาที่ใช้</p>
            </div>
          </div>

          {/* Sound label */}
          <div className="mt-4">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${stage.accentColor}18`, color: stage.accentColor }}
            >
              เสียง {session.targetSound}
            </span>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="space-y-2.5">
        <Link
          href="/training"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm shadow-primary/20"
        >
          กลับแผนที่การฝึก
        </Link>
        <Link
          href="/progress"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-all active:scale-[0.98]"
        >
          ดูรายงานความก้าวหน้า
        </Link>
        <button
          onClick={onRetry}
          className="w-full py-3 rounded-xl text-text-muted text-sm font-medium hover:bg-surface dark:hover:bg-white/5 transition-all active:scale-[0.98]"
        >
          ฝึกซ้ำอีกครั้ง
        </button>
      </div>
    </div>
  );
}
