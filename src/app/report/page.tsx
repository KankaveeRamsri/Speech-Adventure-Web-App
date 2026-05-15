"use client";

import { useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ReportHeader from "@/components/report/ReportHeader";
import ReportMetricCard from "@/components/report/ReportMetricCard";
import ReportStageTable from "@/components/report/ReportStageTable";
import ReportSummaryCard from "@/components/report/ReportSummaryCard";
import PrintActions from "@/components/report/PrintActions";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useObservationNotes } from "@/hooks/useObservationNotes";
import { CATEGORY_META } from "@/types/observations";
import {
  mockChildProfile,
  mockTrainingStages,
  mockTargetSounds,
} from "@/data/speechAdventureMockData";
import {
  loadDemoProgress,
  DEMO_ATTEMPT_COUNT,
} from "@/lib/demo/speechAdventureDemoData";
import type { ProgressSummary } from "@/types/speechAdventure";
import type { StageRow } from "@/components/report/ReportStageTable";

// ── Narrative generator ───────────────────────────────────────────────────────

interface Narrative {
  headline: string;
  details: string[];
  strengths: string[];
  recommendation: string;
}

function buildNarrative(summary: ProgressSummary, completedCount: number): Narrative {
  if (summary.totalAttempts === 0) {
    return {
      headline: "ยังไม่มีข้อมูลการฝึก",
      details: [],
      strengths: [],
      recommendation: "แนะนำให้เริ่มจาก Pre-test เพื่อประเมินระดับเสียงเริ่มต้น",
    };
  }

  const headline =
    completedCount === 7
      ? "น้องผ่านครบทุกระดับแล้ว ทำได้ยอดเยี่ยมมาก"
      : `น้องกำลังอยู่ในระดับ ${summary.currentLevel}`;

  const details: string[] = [
    `ฝึกรวม ${summary.totalAttempts} ครั้ง คะแนนเฉลี่ย ${summary.averageScore}% สะสมดาว ${summary.starsEarned} ดาว`,
    `ผ่านแล้ว ${completedCount} จาก 7 ระดับ`,
  ];
  if (summary.pretestScore > 0 && summary.reviewScore > 0) {
    details.push(
      `Pre-test: ${summary.pretestScore}% → Review: ${summary.reviewScore}% พัฒนาการ +${summary.improvement} คะแนน`
    );
  } else if (summary.pretestScore > 0) {
    details.push(`คะแนน Pre-test เริ่มต้น: ${summary.pretestScore}%`);
  }

  const strengths: string[] = [];
  if (summary.averageScore >= 80) {
    strengths.push("คะแนนเฉลี่ยอยู่ในเกณฑ์ดีมาก น้องออกเสียงได้ชัดเจน");
  } else if (summary.averageScore >= 60) {
    strengths.push("น้องกำลังพัฒนาขึ้นเรื่อยๆ เห็นพัฒนาการที่ดีอย่างต่อเนื่อง");
  }
  if (summary.improvement >= 20) {
    strengths.push(`พัฒนาการเปรียบเทียบ Pre-test ถึง Review ดีขึ้น ${summary.improvement} คะแนน — เกินเป้าหมาย`);
  } else if (summary.improvement > 0) {
    strengths.push(`มีพัฒนาการเทียบจาก Pre-test ดีขึ้น ${summary.improvement} คะแนน`);
  }
  if (completedCount >= 5) {
    strengths.push("ผ่านระดับหลักมาแล้วครึ่งหนึ่ง แสดงให้เห็นถึงความสม่ำเสมอในการฝึก");
  }

  let recommendation: string;
  if (completedCount === 7) {
    recommendation =
      "น้องผ่านครบทุกระดับแล้ว แนะนำให้ทบทวน Review อีกรอบเพื่อเสริมความมั่นใจ และลองเปลี่ยนเสียงเป้าหมายเพื่อฝึกเสียงพยัญชนะอื่นต่อไปค่ะ";
  } else if (summary.difficultItems.length > 0) {
    const items = summary.difficultItems
      .slice(0, 3)
      .map((d) => `"${d.promptText}"`)
      .join(", ");
    recommendation = `แนะนำให้ฝึกคำ ${items} ซ้ำๆ วันละ 5–10 ครั้ง ออกเสียงช้าๆ ทีละพยางค์ก่อน แล้วค่อยเพิ่มความเร็ว ความสม่ำเสมอสำคัญกว่าปริมาณครั้งเดียวค่ะ`;
  } else {
    recommendation = `น้องอยู่ในช่วงของ ${summary.currentLevel} ควรฝึกต่อเนื่องทุกวัน วันละ 10–15 นาที เพื่อรักษาพัฒนาการที่ดีนี้ไว้ค่ะ`;
  }

  return { headline, details, strengths, recommendation };
}

function formatThaiDate(date: Date): string {
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 print:text-gray-500">
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const { summary, getStageStatus, getStageAttempts, isHydrated } = useSpeechProgress();
  const { profile } = useChildProfile();
  const { recentNotes } = useObservationNotes();

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const reportDate = isHydrated ? formatThaiDate(new Date()) : "";

  const selectedSound = mockTargetSounds[0];

  const stageData: StageRow[] = mockTrainingStages.map((stage) => {
    const status = getStageStatus(stage.id);
    const attempts = getStageAttempts(stage.id);
    const sorted = [...attempts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const bestScore =
      attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
    const starsEarned = Math.min(
      attempts.reduce((sum, a) => sum + a.starsEarned, 0),
      stage.starsTotal
    );
    return {
      id: stage.id,
      name: stage.name,
      icon: stage.icon,
      accentColor: stage.accentColor,
      status,
      attemptCount: attempts.length,
      bestScore,
      starsEarned,
      starsTotal: stage.starsTotal,
    };
  });

  const completedCount = stageData.filter(
    (s) => s.status === "completed" || s.status === "review"
  ).length;

  const hasData = isHydrated && summary.totalAttempts > 0;
  const hasReview = isHydrated && summary.reviewScore > 0;

  const liveProfile = {
    ...mockChildProfile,
    name: profile?.name ?? mockChildProfile.name,
    nickname: profile ? profile.name.split(" ")[0] : mockChildProfile.nickname,
    age: profile?.age ?? mockChildProfile.age,
    currentStage: summary.currentStageId,
    totalStars: summary.starsEarned,
    totalAttempts: summary.totalAttempts,
  };

  const narrative = buildNarrative(summary, completedCount);

  const recentAttempts = [...summary.recentAttempts].slice(0, 8);

  const stageLabels: Record<string, string> = {
    pretest:  "Pre-test",
    "level-1": "Oral Motor",
    "level-2": "Sound Familiarity",
    "level-3": "Sound Production",
    "level-4": "Word Practice",
    "level-5": "Sentence Practice",
    review:   "Review",
  };

  function formatDateShort(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    } catch {
      return iso;
    }
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (isHydrated && !hasData) {
    return (
      <main className="min-h-screen bg-bg">
        <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border print:hidden">
          <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
            <Link
              href="/progress"
              className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
            >
              <BackIcon />
              <span className="text-sm font-medium hidden sm:inline">กลับ</span>
            </Link>
            <h1 className="font-semibold text-text text-sm">รายงานผู้ปกครอง / ครู</h1>
            <ThemeToggle />
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">ยังไม่มีข้อมูลการฝึก</h2>
          <p className="text-sm text-text-muted mb-8 max-w-sm mx-auto">
            รายงานจะสร้างขึ้นโดยอัตโนมัติหลังจากที่เด็กเริ่มฝึก
            หรือโหลดข้อมูลสาธิตเพื่อดูตัวอย่างรายงาน
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/training"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-primary/90 transition-all"
            >
              เริ่มฝึกเลย
            </Link>
            <button
              onClick={loadDemoProgress}
              className="inline-flex items-center justify-center gap-2 border border-border text-text font-medium px-6 py-3 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              โหลดข้อมูลสาธิต ({DEMO_ATTEMPT_COUNT} ครั้ง)
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Full report ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-bg print:bg-white pb-20">

      {/* ── Top Nav (hidden on print) ── */}
      <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border print:hidden">
        <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
          <Link
            href="/progress"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
            aria-label="กลับหน้าความก้าวหน้า"
          >
            <BackIcon />
            <span className="text-sm font-medium hidden sm:inline">กลับ</span>
          </Link>

          <h1 className="font-semibold text-text text-sm">รายงานผู้ปกครอง / ครู</h1>

          <div className="flex items-center gap-1">
            <Link
              href="/training"
              className="text-sm font-medium text-primary hover:text-primary/80 px-2.5 py-1.5 rounded-lg hover:bg-primary/8 transition-all hidden sm:block"
            >
              ฝึกต่อ
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Report Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5 print:px-6 print:py-4 print:space-y-4">

        {/* 1. Header */}
        <ReportHeader
          childName={liveProfile.name}
          childNickname={liveProfile.nickname}
          childAge={liveProfile.age}
          childAvatar={liveProfile.avatarEmoji}
          targetSound={selectedSound.label}
          targetSoundLabel={selectedSound.description}
          currentLevel={summary.currentLevel}
          reportDate={reportDate}
          totalAttempts={summary.totalAttempts}
        />

        {/* 2. Overview metrics */}
        {hasData && (
          <section aria-label="ภาพรวมความก้าวหน้า">
            <SectionLabel>ภาพรวม</SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4 print:gap-2">
              <ReportMetricCard
                label="คะแนนเฉลี่ย"
                value={summary.averageScore}
                suffix="%"
                colorClass="text-success"
                subLabel={summary.averageScore >= 70 ? "ผ่านเกณฑ์" : "กำลังพัฒนา"}
              />
              <ReportMetricCard
                label="ครั้งที่ฝึก"
                value={summary.totalAttempts}
                colorClass="text-info"
              />
              <ReportMetricCard
                label="ดาวที่ได้รับ"
                value={`★ ${summary.starsEarned}`}
                colorClass="text-secondary"
              />
              <ReportMetricCard
                label="ระดับที่ผ่าน"
                value={completedCount}
                suffix=" / 7"
                colorClass="text-level-pretest"
              />
            </div>
          </section>
        )}

        {/* 2b. Session summary */}
        {hasData && summary.totalSessions > 0 && (
          <section
            className="bg-surface border border-border rounded-2xl p-5 print:border-gray-200 print:rounded-lg"
            aria-label="สถิติเซสชันการฝึก"
          >
            <SectionLabel>สถิติเซสชันการฝึก</SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4 print:gap-2">
              <div className="bg-primary/8 border border-primary/15 rounded-xl p-4 text-center print:bg-blue-50 print:border-blue-100">
                <p className="text-3xl font-bold text-primary print:text-black">{summary.totalSessions}</p>
                <p className="text-xs text-text-muted mt-1 print:text-gray-500">เซสชันทั้งหมด</p>
              </div>
              <div className="bg-success/8 border border-success/15 rounded-xl p-4 text-center print:bg-green-50 print:border-green-100">
                <p className="text-3xl font-bold text-success print:text-black">{summary.averageSessionScore}%</p>
                <p className="text-xs text-text-muted mt-1 print:text-gray-500">คะแนนเฉลี่ย/เซสชัน</p>
              </div>
              <div className="bg-secondary/8 border border-secondary/15 rounded-xl p-4 text-center print:bg-orange-50 print:border-orange-100">
                <p className="text-3xl font-bold text-secondary print:text-black">
                  ★ {summary.recentSessions.reduce((s, sess) => s + sess.starsEarned, 0)}
                </p>
                <p className="text-xs text-text-muted mt-1 print:text-gray-500">ดาวจากเซสชัน</p>
              </div>
              <div className="bg-info/8 border border-info/15 rounded-xl p-4 text-center print:bg-cyan-50 print:border-cyan-100">
                <p className="text-3xl font-bold text-info print:text-black">
                  {summary.recentSessions.length > 0
                    ? (() => {
                        const totalMs = summary.recentSessions.reduce(
                          (s, sess) => s + (sess.durationMs ?? 0), 0
                        );
                        return totalMs > 0 ? `${Math.round(totalMs / 60000)} นาที` : "—";
                      })()
                    : "—"}
                </p>
                <p className="text-xs text-text-muted mt-1 print:text-gray-500">เวลาฝึกรวม</p>
              </div>
            </div>

            {/* Latest session highlight */}
            {summary.recentSessions.length > 0 && (() => {
              const latest = summary.recentSessions[0];
              const latestStage = mockTrainingStages.find((s) => s.id === latest.stageId);
              return (
                <div className="mt-3 bg-bg dark:bg-white/3 rounded-xl p-4 border border-border print:bg-gray-50 print:border-gray-200">
                  <p className="text-xs font-semibold text-text-muted mb-1 print:text-gray-500">เซสชันล่าสุด</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: `${latestStage?.accentColor ?? "#6C63FF"}15` }}
                      aria-hidden="true"
                    >
                      {latestStage?.icon ?? "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text print:text-black">
                        {latestStage?.name ?? latest.stageId}
                      </p>
                      <p className="text-xs text-text-muted print:text-gray-400">
                        {(() => {
                          try {
                            return new Date(latest.startedAt).toLocaleDateString("th-TH", {
                              day: "numeric", month: "short", year: "numeric",
                            });
                          } catch { return ""; }
                        })()}
                        {" · "}
                        {latest.completedMissions}/{latest.totalMissions} ภารกิจ
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-success print:text-green-700">{latest.averageScore}%</p>
                      <p className="text-xs text-secondary print:text-yellow-600">★ {latest.starsEarned}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* 3. Pre-test vs Review */}
        <section
          className="bg-surface border border-border rounded-2xl p-5 print:border-gray-200 print:rounded-lg"
          aria-label="เปรียบเทียบ Pre-test กับ Review"
        >
          <SectionLabel>พัฒนาการ Pre-test → Review</SectionLabel>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Pre-test */}
            <div className="bg-level-pretest/8 border border-level-pretest/20 rounded-xl p-4 text-center print:bg-gray-50 print:border-gray-200">
              <p className="text-xs font-semibold text-level-pretest mb-2 print:text-gray-500">Pre-test</p>
              <p className="text-4xl font-bold text-level-pretest print:text-black">
                {summary.pretestScore > 0 ? summary.pretestScore : "—"}
              </p>
              <p className="text-xs text-text-muted mt-1 print:text-gray-400">
                {summary.pretestScore > 0 ? "คะแนนเริ่มต้น" : "ยังไม่ได้ทำ"}
              </p>
            </div>

            {/* Review */}
            <div className={`rounded-xl p-4 text-center border ${
              hasReview
                ? "bg-success/8 border-success/20 print:bg-green-50 print:border-green-200"
                : "bg-gray-50 dark:bg-white/3 border-border print:bg-gray-50 print:border-gray-200"
            }`}>
              <p className={`text-xs font-semibold mb-2 ${
                hasReview ? "text-success print:text-green-700" : "text-text-muted print:text-gray-400"
              }`}>
                Review
              </p>
              <p className={`text-4xl font-bold ${
                hasReview ? "text-success print:text-black" : "text-text-muted print:text-gray-400"
              }`}>
                {hasReview ? summary.reviewScore : "—"}
              </p>
              <p className="text-xs text-text-muted mt-1 print:text-gray-400">
                {hasReview ? "คะแนนหลังฝึก" : "ยังไม่มีข้อมูล"}
              </p>
            </div>

            {/* Improvement */}
            {hasReview && summary.improvement !== 0 ? (
              <div className={`rounded-xl p-4 text-center border ${
                summary.improvement > 0
                  ? "bg-success/8 border-success/20 print:bg-green-50 print:border-green-200"
                  : "bg-secondary/8 border-secondary/20 print:bg-orange-50 print:border-orange-200"
              }`}>
                <p className="text-xs font-semibold text-success mb-2 print:text-green-700">
                  พัฒนาการ
                </p>
                <p className="text-4xl font-bold text-success print:text-black">
                  {summary.improvement > 0 ? "+" : ""}{summary.improvement}
                </p>
                <p className="text-xs text-text-muted mt-1 print:text-gray-400">คะแนน</p>
              </div>
            ) : (
              <div className="hidden sm:flex items-center justify-center rounded-xl border-2 border-dashed border-border print:hidden">
                <p className="text-xs text-text-muted text-center px-3">
                  เมื่อผ่าน Review จะเห็นพัฒนาการที่นี่
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 4. Stage breakdown */}
        <section aria-label="ผลการฝึกแต่ละระดับ">
          <ReportStageTable stages={stageData} />
        </section>

        {/* 5. Difficult items */}
        {summary.difficultItems.length > 0 && (
          <section
            className="bg-surface border border-border rounded-2xl p-5 print:border-gray-200 print:rounded-lg"
            aria-label="รายการที่ต้องฝึกเพิ่ม"
          >
            <SectionLabel>รายการที่ต้องฝึกเพิ่ม</SectionLabel>
            <div className="space-y-2">
              {summary.difficultItems.map((item) => (
                <div
                  key={item.practiceItemId}
                  className="flex items-center gap-3 bg-secondary/5 border border-secondary/15 rounded-xl px-4 py-3 print:bg-orange-50 print:border-orange-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/12 flex items-center justify-center flex-shrink-0 print:bg-orange-100">
                    <span className="text-xs font-bold text-secondary print:text-orange-700">
                      {item.averageScore}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text text-sm print:text-black">{item.promptText}</p>
                    <p className="text-xs text-text-muted print:text-gray-400">
                      ฝึก {item.attempts} ครั้ง · คะแนนเฉลี่ย {item.averageScore}%
                    </p>
                  </div>
                  <span className="hidden sm:block text-xs text-secondary print:text-orange-600">
                    ต้องฝึกเพิ่ม
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Recent practice table */}
        {recentAttempts.length > 0 && (
          <section
            className="bg-surface border border-border rounded-2xl overflow-hidden print:border-gray-200 print:rounded-lg"
            aria-label="ประวัติการฝึกล่าสุด"
          >
            <div className="px-5 py-3 border-b border-border bg-bg/60 dark:bg-white/3 print:bg-gray-50 print:border-gray-200">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider print:text-gray-500">
                ประวัติการฝึกล่าสุด
              </p>
            </div>
            <div className="divide-y divide-border print:divide-gray-100">
              {recentAttempts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <div className={`w-10 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    a.score >= 70
                      ? "bg-success/12 text-success print:bg-green-50 print:text-green-700"
                      : "bg-secondary/12 text-secondary print:bg-orange-50 print:text-orange-700"
                  }`}>
                    {a.score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate print:text-black">{a.promptText}</p>
                    <p className="text-xs text-text-muted print:text-gray-400">
                      {stageLabels[a.stageId] ?? a.stageId} · {formatDateShort(a.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs text-secondary flex-shrink-0 print:text-yellow-500">
                    {"★".repeat(a.starsEarned)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Narrative summary */}
        <ReportSummaryCard
          headline={narrative.headline}
          details={narrative.details}
          strengths={narrative.strengths}
          recommendation={narrative.recommendation}
          reportDate={reportDate}
          isMock
        />

        {/* 8. Parent / Teacher Observations */}
        {recentNotes.length > 0 && (
          <section
            className="bg-surface border border-border rounded-2xl p-5 print:border-gray-200 print:rounded-lg"
            aria-label="บันทึกของผู้ปกครองและครู"
          >
            <SectionLabel>บันทึกจากผู้ปกครอง / ครู</SectionLabel>

            {/* Recommendation notes highlighted */}
            {recentNotes.filter((n) => n.category === "recommendation").length > 0 && (
              <div className="mb-4 space-y-2">
                {recentNotes
                  .filter((n) => n.category === "recommendation")
                  .map((note) => {
                    const meta = CATEGORY_META[note.category];
                    return (
                      <div
                        key={note.id}
                        className="rounded-xl p-4 border print:bg-orange-50 print:border-orange-100"
                        style={{ backgroundColor: `${meta.color}0C`, borderColor: `${meta.color}30` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          {note.title && (
                            <p className="text-sm font-bold text-text print:text-black">{note.title}</p>
                          )}
                        </div>
                        <p className="text-sm text-text leading-relaxed print:text-black">{note.content}</p>
                        <p className="text-xs text-text-muted mt-2 print:text-gray-400">
                          {(() => {
                            try { return new Date(note.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }); }
                            catch { return ""; }
                          })()}
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Other notes */}
            {recentNotes.filter((n) => n.category !== "recommendation").length > 0 && (
              <div className="space-y-3">
                {recentNotes
                  .filter((n) => n.category !== "recommendation")
                  .slice(0, 5)
                  .map((note) => {
                    const meta = CATEGORY_META[note.category];
                    return (
                      <div
                        key={note.id}
                        className="flex gap-3 py-3 border-b border-border last:border-0 print:border-gray-100"
                      >
                        <span
                          className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full self-start mt-0.5"
                          style={{ backgroundColor: `${meta.color}14`, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          {note.title && (
                            <p className="text-sm font-semibold text-text mb-0.5 print:text-black">{note.title}</p>
                          )}
                          <p className="text-sm text-text-muted leading-relaxed print:text-gray-500">{note.content}</p>
                          <p className="text-xs text-text-muted/50 mt-1 print:text-gray-400">
                            {(() => {
                              try { return new Date(note.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" }); }
                              catch { return ""; }
                            })()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <p className="text-xs text-text-muted text-center mt-4 print:text-gray-400">
              ดูบันทึกทั้งหมดได้ที่หน้ารายงานความก้าวหน้า
            </p>
          </section>
        )}

        {/* 10. Print footer */}
        <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
          <p>Speech Adventure — ระบบฝึกพูดสำหรับเด็กไทย · รายงานนี้สร้างโดยอัตโนมัติจากข้อมูลการฝึก</p>
          <p className="mt-1">Prototype v1.0 · ผลประเมินใช้ Mock Evaluation · AI จริงยังอยู่ระหว่างพัฒนา</p>
        </div>

      </div>

      {/* Print actions bar */}
      {hasData && <PrintActions onPrint={handlePrint} backHref="/progress" />}
    </main>
  );
}
