"use client";

import { useState } from "react";
import Link from "next/link";
import ChildProfileCard from "@/components/speech-adventure/ChildProfileCard";
import RecentAttemptsList from "@/components/speech-adventure/RecentAttemptsList";
import StageProgressCard from "@/components/speech-adventure/StageProgressCard";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { mockChildProfile, mockTrainingStages } from "@/data/speechAdventureMockData";
import type { ProgressSummary } from "@/types/speechAdventure";

// ─── Report Generator ────────────────────────────────────────────────────────

interface ReportData {
  headline: string;
  details: string[];
  strengths: string[];
  recommendation: string;
}

function generateReport(
  summary: ProgressSummary,
  completedCount: number
): ReportData {
  if (summary.totalAttempts === 0) {
    return {
      headline: "น้องยังไม่ได้เริ่มฝึก",
      details: [
        "ยังไม่มีข้อมูลการฝึกในระบบ",
        "แนะนำให้เริ่มจาก Pre-test เพื่อประเมินระดับเสียงเริ่มต้น",
      ],
      strengths: [],
      recommendation:
        "เริ่มทำ Pre-test ได้เลยนะคะ ไม่มีผิดไม่มีถูก แค่วัดระดับเสียงตอนนี้ค่ะ",
    };
  }

  const details: string[] = [
    `ฝึกรวม ${summary.totalAttempts} ครั้ง · คะแนนเฉลี่ย ${summary.averageScore}%`,
    `ผ่านมาแล้ว ${completedCount} จาก 7 ระดับ · สะสมดาวได้ ${summary.starsEarned} ดาว`,
  ];

  const strengths: string[] = [];

  if (summary.averageScore >= 80) {
    strengths.push("คะแนนเฉลี่ยอยู่ในเกณฑ์ดีมาก น้องออกเสียงได้ชัดเจน ✨");
  } else if (summary.averageScore >= 60) {
    strengths.push("น้องกำลังพัฒนาขึ้นเรื่อยๆ ทำได้ดีมากค่ะ");
  }

  if (summary.reviewScore > 0 && summary.improvement > 0) {
    strengths.push(
      `พัฒนาการจาก Pre-test ถึง Review: +${summary.improvement} คะแนน 🎉`
    );
  }

  if (completedCount >= 5) {
    strengths.push("น้องมีความสม่ำเสมอในการฝึก ผ่านมาหลายระดับแล้ว");
  }

  let recommendation: string;
  if (completedCount === 7) {
    recommendation =
      "น้องผ่านครบทุกระดับแล้ว! ลองทบทวน Review อีกรอบเพื่อความมั่นใจนะคะ";
  } else if (summary.difficultItems.length > 0) {
    const items = summary.difficultItems
      .slice(0, 2)
      .map((d) => `"${d.promptText}"`)
      .join(", ");
    recommendation = `แนะนำให้ฝึกคำ ${items} ซ้ำๆ เพื่อเสริมความมั่นใจค่ะ พยายามออกเสียงช้าๆ ทีละพยางค์`;
  } else {
    recommendation = `ขณะนี้น้องอยู่ที่ ${summary.currentLevel} ควรฝึกต่อเนื่องทุกวัน วันละ 10–15 นาทีค่ะ`;
  }

  return { headline: `น้องอยู่ที่ ${summary.currentLevel}`, details, strengths, recommendation };
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatThaiDate(): string {
  return new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProgressDashboardPage() {
  const { summary, clearProgress, getStageStatus, getStageAttempts, isHydrated } =
    useSpeechProgress();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const liveProfile = {
    ...mockChildProfile,
    currentStage: summary.currentStageId,
    totalStars: summary.starsEarned,
    totalAttempts: summary.totalAttempts,
  };

  // Compute live per-stage stats from localStorage attempts
  const stageData = mockTrainingStages.map((stage) => {
    const status = getStageStatus(stage.id);
    const attempts = getStageAttempts(stage.id);
    const sorted = [...attempts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const bestScore =
      attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
    const latestScore = sorted.length > 0 ? sorted[0].score : null;
    const liveStarsEarned = Math.min(
      attempts.reduce((sum, a) => sum + a.starsEarned, 0),
      stage.starsTotal
    );
    return {
      ...stage,
      status,
      attemptCount: attempts.length,
      bestScore,
      latestScore,
      starsEarned: liveStarsEarned,
    };
  });

  const completedCount = stageData.filter(
    (s) => s.status === "completed"
  ).length;

  // Only treat data as present after hydration — pre-hydration progress is empty.
  const hasData = isHydrated && summary.totalAttempts > 0;
  const hasReview = isHydrated && summary.reviewScore > 0;
  const report = generateReport(summary, completedCount);
  // Render date only after hydration to avoid server/client timezone mismatch.
  const dateStr = isHydrated ? formatThaiDate() : "";

  const handleReset = () => {
    clearProgress();
    setShowResetConfirm(false);
  };

  return (
    <main className="min-h-screen bg-bg">
      {/* ── Top Bar ── */}
      <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
            aria-label="กลับหน้าแรก"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium hidden sm:inline">กลับ</span>
          </Link>
          <h1 className="font-bold text-text">📊 รายงานความก้าวหน้า</h1>
          <Link
            href="/training"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            🗺️ ฝึกต่อ
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        {/* ── Page Header ── */}
        <div>
          <h2 className="text-2xl font-bold text-text">รายงานความก้าวหน้า</h2>
          <p className="text-sm text-text-muted mt-1">
            สำหรับผู้ปกครองและคุณครู{dateStr ? ` · ${dateStr}` : ""}
          </p>
        </div>

        {/* ── Child Profile ── */}
        <ChildProfileCard
          profile={liveProfile}
          isHydrated={isHydrated}
          averageScore={summary.averageScore}
        />

        {/* ── SECTION 1: Overview Cards ── */}
        {hasData ? (
          <section aria-label="ภาพรวมความก้าวหน้า">
            <h3 className="text-lg font-bold text-text mb-3">📌 ภาพรวม</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

              {/* Average Score */}
              <div className="bg-success/10 rounded-2xl p-4">
                <p className="text-xs font-semibold text-success mb-1">
                  คะแนนเฉลี่ย
                </p>
                <p className="text-4xl font-bold text-success leading-none">
                  {summary.averageScore}
                  <span className="text-base font-medium">%</span>
                </p>
              </div>

              {/* Total Attempts */}
              <div className="bg-info/10 rounded-2xl p-4">
                <p className="text-xs font-semibold text-info mb-1">
                  ครั้งที่ฝึก
                </p>
                <p className="text-4xl font-bold text-info leading-none">
                  {summary.totalAttempts}
                </p>
              </div>

              {/* Stars Earned */}
              <div className="bg-secondary/10 rounded-2xl p-4">
                <p className="text-xs font-semibold text-secondary mb-1">
                  ดาวที่ได้รับ
                </p>
                <p className="text-4xl font-bold text-secondary leading-none">
                  ⭐ {summary.starsEarned}
                </p>
              </div>

              {/* Completed Stages — spans 2 cols on mobile */}
              <div className="bg-level-pretest/10 rounded-2xl p-4 col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold text-level-pretest mb-1">
                  ระดับที่ผ่านแล้ว
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <p className="text-4xl font-bold text-level-pretest leading-none">
                    {completedCount}
                  </p>
                  <p className="text-sm text-level-pretest/70">/ 7</p>
                </div>
                <div className="h-1.5 bg-level-pretest/20 rounded-full">
                  <div
                    className="h-full bg-level-pretest rounded-full transition-all duration-700"
                    style={{ width: `${(completedCount / 7) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Stage */}
              <div className="bg-primary/10 rounded-2xl p-4 col-span-2 sm:col-span-2">
                <p className="text-xs font-semibold text-primary mb-1">
                  ระดับปัจจุบัน
                </p>
                <p className="text-base font-bold text-primary leading-snug">
                  {summary.currentLevel}
                </p>
              </div>

            </div>
          </section>
        ) : (
          /* Empty state */
          <section className="bg-surface rounded-3xl p-8 shadow-sm text-center">
            <p className="text-5xl mb-3" aria-hidden="true">🌱</p>
            <h3 className="text-lg font-bold text-text mb-1">ยังไม่มีข้อมูล</h3>
            <p className="text-sm text-text-muted mb-5">
              เริ่มฝึกวันนี้เพื่อเห็นรายงานความก้าวหน้าของน้องค่ะ
            </p>
            <Link
              href="/training"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              🚀 เริ่มฝึกเลย
            </Link>
          </section>
        )}

        {/* ── SECTION 2: Pretest vs Review ── */}
        <section
          className="bg-surface rounded-3xl p-6 shadow-sm"
          aria-label="เปรียบเทียบ Pre-test กับ Review"
        >
          <h3 className="text-lg font-bold text-text mb-4">
            📈 Pre-test vs Review
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Pretest Score */}
            <div className="bg-level-pretest/10 rounded-2xl p-5 text-center">
              <p className="text-xs font-semibold text-level-pretest mb-2">
                คะแนน Pre-test
              </p>
              <p className="text-5xl font-bold text-level-pretest">
                {summary.pretestScore > 0 ? summary.pretestScore : "—"}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {summary.pretestScore > 0 ? "ระดับเสียงเริ่มต้น" : "ยังไม่ได้ทำ"}
              </p>
            </div>

            {/* Review Score */}
            <div
              className={`rounded-2xl p-5 text-center ${
                hasReview ? "bg-success/10" : "bg-gray-50"
              }`}
            >
              <p
                className={`text-xs font-semibold mb-2 ${
                  hasReview ? "text-success" : "text-text-muted"
                }`}
              >
                คะแนน Review
              </p>
              <p
                className={`text-5xl font-bold ${
                  hasReview ? "text-success" : "text-text-muted"
                }`}
              >
                {hasReview ? summary.reviewScore : "—"}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {hasReview ? "หลังฝึกเสร็จ" : "ยังไม่มีข้อมูล"}
              </p>
            </div>
          </div>

          {/* Improvement Badge */}
          {hasReview && summary.improvement > 0 && (
            <div className="bg-success/10 rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-success">🎉 พัฒนาการ</p>
              <p className="text-4xl font-bold text-success">
                +{summary.improvement}
                <span className="text-lg font-medium"> คะแนน</span>
              </p>
              <p className="text-sm text-text-muted mt-1">
                {summary.improvement >= 30
                  ? "พัฒนาการยอดเยี่ยม!"
                  : summary.improvement >= 15
                  ? "พัฒนาการดีมาก!"
                  : "พัฒนาการดีขึ้นเรื่อยๆ!"}
              </p>
            </div>
          )}

          {/* Empty state: Review not done yet */}
          {!hasReview && (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-1" aria-hidden="true">🔮</p>
              <p className="text-sm text-text-muted">
                เมื่อน้องทำ Review เสร็จ จะเห็นการเปรียบเทียบ Pre-test กับ
                Review ที่นี่ค่ะ
              </p>
            </div>
          )}
        </section>

        {/* ── SECTION 3: Stage Progress ── */}
        <section
          className="bg-surface rounded-3xl p-6 shadow-sm"
          aria-label="ความคืบหน้าในแต่ละระดับ"
        >
          <h3 className="text-lg font-bold text-text mb-4">
            📍 ความคืบหน้าในแต่ละระดับ
          </h3>
          <div className="space-y-2">
            {stageData.map((stage) => (
              <StageProgressCard
                key={stage.id}
                stageName={stage.name}
                stageIcon={stage.icon}
                accentColor={stage.accentColor}
                status={stage.status}
                starsEarned={stage.starsEarned}
                starsTotal={stage.starsTotal}
                attemptCount={stage.attemptCount}
                bestScore={stage.bestScore ?? undefined}
                latestScore={stage.latestScore ?? undefined}
              />
            ))}
          </div>
        </section>

        {/* ── SECTION 4: Difficult Items ── */}
        <section
          className="bg-surface rounded-3xl p-6 shadow-sm"
          aria-label="รายการที่ต้องฝึกเพิ่ม"
        >
          <h3 className="text-lg font-bold text-text mb-4">
            🎯 รายการที่ต้องฝึกเพิ่ม
          </h3>

          {summary.difficultItems.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2" aria-hidden="true">
                {hasData ? "🌟" : "📝"}
              </p>
              <p className="text-sm text-text-muted">
                {hasData
                  ? "ยังไม่มีรายการที่ยาก ทำได้ดีมากค่ะ!"
                  : "เริ่มฝึกเพื่อดูรายการที่ควรฝึกเพิ่มค่ะ"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.difficultItems.map((item) => (
                <div
                  key={item.practiceItemId}
                  className="flex items-start gap-4 bg-secondary/5 rounded-2xl p-4"
                >
                  {/* Score Badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/15 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-secondary leading-none">
                      {item.averageScore}%
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text text-sm">
                      {item.promptText}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      ฝึก {item.attempts} ครั้ง · คะแนนเฉลี่ย {item.averageScore}%
                    </p>
                    <p className="text-xs text-secondary mt-1.5">
                      💡 ลองฟังเสียงตัวอย่างแล้วออกเสียงช้าๆ ทีละพยางค์นะคะ
                    </p>
                  </div>
                </div>
              ))}

              {/* General tip */}
              <div className="bg-info/10 rounded-2xl p-4 mt-2">
                <p className="text-xs font-semibold text-info mb-1">
                  💬 คำแนะนำสำหรับผู้ปกครอง
                </p>
                <p className="text-sm text-text">
                  ฝึกคำยากๆ ซ้ำๆ วันละ 5–10 ครั้ง โดยออกเสียงช้าๆ
                  แล้วค่อยเพิ่มความเร็วขึ้น การฝึกสม่ำเสมอจะช่วยให้น้องพัฒนาได้เร็วขึ้นค่ะ
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── SECTION 5: Recent Practice History ── */}
        <RecentAttemptsList attempts={summary.recentAttempts} />

        {/* ── SECTION 6: Report Summary (Parent/Teacher) ── */}
        <section
          className="bg-gradient-to-br from-primary/5 via-surface to-level-pretest/5 rounded-3xl p-6 shadow-sm border border-primary/10"
          aria-label="รายงานสำหรับผู้ปกครอง"
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl" aria-hidden="true">📋</span>
            <div>
              <h3 className="text-lg font-bold text-text">
                รายงานสำหรับผู้ปกครอง
              </h3>
              <p className="text-xs text-text-muted">ข้อมูล ณ {dateStr}</p>
            </div>
          </div>

          {/* Headline */}
          <div className="bg-white/80 border border-primary/10 rounded-2xl p-4 mb-4">
            <p className="font-bold text-text text-base">{report.headline}</p>
          </div>

          {/* Details */}
          {report.details.length > 0 && (
            <ul className="space-y-2 mb-4">
              {report.details.map((detail, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-text"
                >
                  <span className="text-primary flex-shrink-0 mt-0.5 font-bold">
                    •
                  </span>
                  {detail}
                </li>
              ))}
            </ul>
          )}

          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-success uppercase tracking-wide mb-2">
                จุดแข็ง
              </p>
              <ul className="space-y-1.5">
                {report.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-text"
                  >
                    <span className="text-success flex-shrink-0 font-bold">
                      ✓
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation box */}
          <div className="bg-primary/10 rounded-2xl p-4">
            <p className="text-xs font-bold text-primary mb-1.5">
              📌 คำแนะนำสำหรับผู้ปกครอง
            </p>
            <p className="text-sm text-text leading-relaxed">
              {report.recommendation}
            </p>
          </div>

          <p className="text-xs text-text-muted text-center mt-4">
            * ผลประเมินนี้เป็นข้อมูลสาธิต (Mock Evaluation) ยังไม่ใช่ AI ประเมินเสียงจริง
          </p>
        </section>

        {/* ── Reset + Back to Training ── */}
        <div className="text-center pt-2 pb-8 space-y-6">
          {showResetConfirm ? (
            <div className="inline-block bg-surface rounded-3xl p-6 shadow-sm">
              <p className="text-sm text-text mb-4">
                ต้องการล้างข้อมูลความก้าวหน้าทั้งหมดหรือไม่?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-5 py-2.5 rounded-2xl border-2 border-gray-200 text-text-muted font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-2xl bg-error text-white font-semibold text-sm hover:bg-error/90 transition-all"
                >
                  🗑️ ล้างข้อมูล
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-sm text-text-muted hover:text-error transition-colors underline underline-offset-4"
            >
              🔄 ล้างข้อมูลสาธิต
            </button>
          )}

          <div>
            <Link
              href="/training"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              🗺️ กลับไปฝึกต่อ
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
