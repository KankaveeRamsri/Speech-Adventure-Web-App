"use client";

import { useState } from "react";
import Link from "next/link";
import ChildProfileCard from "@/components/speech-adventure/ChildProfileCard";
import RecentAttemptsList from "@/components/speech-adventure/RecentAttemptsList";
import StageProgressCard from "@/components/speech-adventure/StageProgressCard";
import ObservationNoteList from "@/components/observations/ObservationNoteList";
import AppShell from "@/components/layout/AppShell";
import SessionDetailDrawer from "@/components/details/SessionDetailDrawer";
import AttemptDetailDrawer from "@/components/details/AttemptDetailDrawer";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useObservationNotes } from "@/hooks/useObservationNotes";
import { mockChildProfile, mockTrainingStages } from "@/data/speechAdventureMockData";
import {
  loadDemoProgress,
  resetDemoProgress,
  DEMO_ATTEMPT_COUNT,
} from "@/lib/demo/speechAdventureDemoData";
import { clearObservations } from "@/lib/observations/observationStorage";
import type { ProgressSummary, PracticeSession, PracticeAttempt } from "@/types/speechAdventure";
import { calculateRewards } from "@/lib/rewards/calculateRewards";

// ─── Helpers ────────────────────────────────────────────────────────────────────

interface ReportData {
  headline: string;
  details: string[];
  strengths: string[];
  recommendation: string;
}

function generateReport(summary: ProgressSummary, completedCount: number): ReportData {
  if (summary.totalAttempts === 0) {
    return {
      headline: "น้องยังไม่ได้เริ่มฝึก",
      details: ["ยังไม่มีข้อมูลการฝึกในระบบ", "แนะนำให้เริ่มจาก Pre-test เพื่อประเมินระดับเสียงเริ่มต้น"],
      strengths: [],
      recommendation: "เริ่มทำ Pre-test ได้เลยนะคะ ไม่มีผิดไม่มีถูก แค่วัดระดับเสียงตอนนี้ค่ะ",
    };
  }
  const details = [
    `ฝึกรวม ${summary.totalAttempts} ครั้ง · คะแนนเฉลี่ย ${summary.averageScore}%`,
    `ผ่านมาแล้ว ${completedCount} จาก 7 ระดับ · สะสมดาว ${summary.starsEarned} ดาว`,
  ];
  const strengths: string[] = [];
  if (summary.averageScore >= 80) strengths.push("คะแนนเฉลี่ยอยู่ในเกณฑ์ดีมาก น้องออกเสียงได้ชัดเจน");
  else if (summary.averageScore >= 60) strengths.push("น้องกำลังพัฒนาขึ้นเรื่อยๆ ทำได้ดีมากค่ะ");
  if (summary.reviewScore > 0 && summary.improvement > 0)
    strengths.push(`พัฒนาการจาก Pre-test ถึง Review: +${summary.improvement} คะแนน`);
  if (completedCount >= 5) strengths.push("น้องมีความสม่ำเสมอในการฝึก ผ่านมาหลายระดับแล้ว");
  let recommendation: string;
  if (completedCount === 7) {
    recommendation = "น้องผ่านครบทุกระดับแล้ว! ลองทบทวน Review อีกรอบเพื่อความมั่นใจนะคะ";
  } else if (summary.difficultItems.length > 0) {
    const items = summary.difficultItems.slice(0, 2).map((d) => `"${d.promptText}"`).join(", ");
    recommendation = `แนะนำให้ฝึกคำ ${items} ซ้ำๆ เพื่อเสริมความมั่นใจค่ะ ออกเสียงช้าๆ ทีละพยางค์`;
  } else {
    recommendation = `ขณะนี้น้องอยู่ที่ ${summary.currentLevel} ควรฝึกต่อเนื่องทุกวัน วันละ 10–15 นาทีค่ะ`;
  }
  return { headline: `น้องอยู่ที่ ${summary.currentLevel}`, details, strengths, recommendation };
}

function formatThaiDate(): string {
  return new Date().toLocaleDateString("th-TH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Tabs ───────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "ภาพรวม" },
  { id: "sessions", label: "เซสชัน" },
  { id: "attempts", label: "ประวัติ" },
  { id: "notes", label: "บันทึก" },
  { id: "report", label: "รายงาน" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ProgressDashboardPage() {
  const { progress, summary, clearProgress, getStageStatus, getStageAttempts, isHydrated } =
    useSpeechProgress();
  const { profile, hasProfile } = useChildProfile();
  const { notes, addNote, updateNote, deleteNote } = useObservationNotes();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<PracticeAttempt | null>(null);

  // ── Derived data ──────────────────────────────────────────────────────────────

  const liveProfile = {
    ...mockChildProfile,
    name: profile?.name ?? mockChildProfile.name,
    nickname: profile ? profile.name.split(" ")[0] : mockChildProfile.nickname,
    age: profile?.age ?? mockChildProfile.age,
    currentStage: summary.currentStageId,
    totalStars: summary.starsEarned,
    totalAttempts: summary.totalAttempts,
  };

  const stageData = mockTrainingStages.map((stage) => {
    const status = getStageStatus(stage.id);
    const attempts = getStageAttempts(stage.id);
    const sorted = [...attempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
    const latestScore = sorted.length > 0 ? sorted[0].score : null;
    const liveStarsEarned = Math.min(attempts.reduce((sum, a) => sum + a.starsEarned, 0), stage.starsTotal);
    return { ...stage, status, attemptCount: attempts.length, bestScore, latestScore, starsEarned: liveStarsEarned };
  });

  const completedCount = stageData.filter((s) => s.status === "completed").length;
  const hasData = isHydrated && summary.totalAttempts > 0;
  const rewardResult = isHydrated ? calculateRewards(progress) : null;
  const hasReview = isHydrated && summary.reviewScore > 0;
  const report = generateReport(summary, completedCount);
  const dateStr = isHydrated ? formatThaiDate() : "";

  // Next best action
  const currentStageForAction = isHydrated
    ? mockTrainingStages.find((s) => s.id === summary.currentStageId)
    : null;

  // Latest observation note
  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null;

  // Recent sessions for sidebar preview (last 3)
  const recentSessionsPreview = summary.recentSessions.slice(0, 3);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    clearProgress();
    clearObservations();
    setShowResetConfirm(false);
  };

  const handleLoadDemo = () => {
    if (summary.totalAttempts > 0) {
      setShowDemoConfirm(true);
    } else {
      loadDemoProgress();
    }
  };

  const handleConfirmLoadDemo = () => {
    loadDemoProgress();
    setShowDemoConfirm(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      {/* ── Sticky tab bar ── */}
      <div className="sticky top-14 z-20 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="flex overflow-x-auto gap-1 px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-white/8"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {activeTab === "overview" && (
        <div className="px-4 sm:px-6 py-6">
          {/* Desktop: two-column layout. Mobile: single column */}
          <div className="xl:flex xl:gap-6 xl:items-start">
            {/* Main column */}
            <div className="xl:flex-1 xl:min-w-0 space-y-5">
              {/* Page header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-text">รายงานความก้าวหน้า</h2>
                  <p className="text-sm text-text-muted mt-0.5">
                    สำหรับผู้ปกครองและคุณครู{dateStr ? ` · ${dateStr}` : ""}
                  </p>
                </div>
                {isHydrated && (
                  <Link
                    href="/onboarding"
                    className="flex-shrink-0 text-sm font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-xl hover:bg-primary/8 transition-all border border-primary/20"
                  >
                    {hasProfile ? "แก้ไขโปรไฟล์" : "ตั้งค่าโปรไฟล์"}
                  </Link>
                )}
              </div>

              {/* Child profile card */}
              <ChildProfileCard profile={liveProfile} isHydrated={isHydrated} averageScore={summary.averageScore} />

              {/* Stats grid */}
              {hasData ? (
                <section aria-label="ภาพรวมความก้าวหน้า">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">ภาพรวม</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="bg-surface border border-border rounded-xl p-4">
                      <p className="text-xs font-medium text-text-muted mb-2">คะแนนเฉลี่ย</p>
                      <p className="text-3xl font-bold text-success leading-none">
                        {summary.averageScore}<span className="text-sm ml-0.5">%</span>
                      </p>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4">
                      <p className="text-xs font-medium text-text-muted mb-2">ครั้งที่ฝึก</p>
                      <p className="text-3xl font-bold text-info leading-none">{summary.totalAttempts}</p>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4">
                      <p className="text-xs font-medium text-text-muted mb-2">ดาวที่ได้รับ</p>
                      <p className="text-3xl font-bold text-secondary leading-none">
                        <span className="text-xl">★</span> {summary.starsEarned}
                      </p>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4">
                      <p className="text-xs font-medium text-text-muted mb-2">ระดับที่ผ่าน</p>
                      <div className="flex items-baseline gap-1 mb-1.5">
                        <p className="text-3xl font-bold text-level-pretest leading-none">{completedCount}</p>
                        <p className="text-sm text-text-muted">/ 7</p>
                      </div>
                      <div className="h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-level-pretest rounded-full transition-all duration-700"
                          style={{ width: `${(completedCount / 7) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-primary mb-0.5">ระดับปัจจุบัน</p>
                    <p className="font-semibold text-text">{summary.currentLevel}</p>
                  </div>
                </section>
              ) : (
                <section className="bg-surface border border-border rounded-xl p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-text mb-1">ยังไม่มีข้อมูล</h3>
                  <p className="text-sm text-text-muted mb-5">เริ่มฝึกวันนี้เพื่อเห็นรายงานความก้าวหน้า</p>
                  <Link
                    href="/training"
                    className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    เริ่มฝึกเลย
                  </Link>
                </section>
              )}

              {/* Next Best Action card */}
              {isHydrated && (
                <section aria-label="ขั้นต่อไปที่แนะนำ">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">ขั้นต่อไปที่แนะนำ</p>
                  {currentStageForAction ? (
                    <div
                      className="flex items-center justify-between gap-4 rounded-xl px-5 py-4 border"
                      style={{
                        backgroundColor: `${currentStageForAction.accentColor}10`,
                        borderColor: `${currentStageForAction.accentColor}30`,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0" aria-hidden="true">{currentStageForAction.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-text text-sm">{currentStageForAction.name}</p>
                          <p className="text-xs text-text-muted truncate">{currentStageForAction.shortGoal}</p>
                        </div>
                      </div>
                      <Link
                        href={`/training/${currentStageForAction.slug}`}
                        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: currentStageForAction.accentColor }}
                      >
                        ฝึกเลย
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 rounded-xl px-5 py-4 border border-primary/20 bg-primary/8">
                      <div>
                        <p className="font-bold text-text text-sm">เริ่มต้นด้วย Pre-test</p>
                        <p className="text-xs text-text-muted">ประเมินระดับเสียงเริ่มต้นของน้อง</p>
                      </div>
                      <Link
                        href="/training/pretest"
                        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        เริ่มเลย
                      </Link>
                    </div>
                  )}
                </section>
              )}

              {/* Pre-test vs Review */}
              <section className="bg-surface border border-border rounded-xl p-5" aria-label="เปรียบเทียบ Pre-test กับ Review">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Pre-test vs Review</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-level-pretest/8 border border-level-pretest/20 rounded-xl p-4 text-center">
                    <p className="text-xs font-medium text-level-pretest mb-2">Pre-test</p>
                    <p className="text-4xl font-bold text-level-pretest">
                      {summary.pretestScore > 0 ? summary.pretestScore : "—"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {summary.pretestScore > 0 ? "ระดับเสียงเริ่มต้น" : "ยังไม่ได้ทำ"}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 text-center border ${
                    hasReview ? "bg-success/8 border-success/20" : "bg-gray-50 dark:bg-white/3 border-border"
                  }`}>
                    <p className={`text-xs font-medium mb-2 ${hasReview ? "text-success" : "text-text-muted"}`}>Review</p>
                    <p className={`text-4xl font-bold ${hasReview ? "text-success" : "text-text-muted"}`}>
                      {hasReview ? summary.reviewScore : "—"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{hasReview ? "หลังฝึกเสร็จ" : "ยังไม่มีข้อมูล"}</p>
                  </div>
                </div>
                {hasReview && summary.improvement > 0 && (
                  <div className="bg-success/8 border border-success/20 rounded-xl p-4 text-center">
                    <p className="text-xs font-medium text-success mb-1">พัฒนาการ</p>
                    <p className="text-3xl font-bold text-success">
                      +{summary.improvement}<span className="text-base ml-1">คะแนน</span>
                    </p>
                  </div>
                )}
                {!hasReview && (
                  <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                    <p className="text-sm text-text-muted">
                      เมื่อน้องทำ Review เสร็จ จะเห็นการเปรียบเทียบที่นี่
                    </p>
                  </div>
                )}
              </section>

              {/* Stage progress */}
              <section className="bg-surface border border-border rounded-xl p-5" aria-label="ความคืบหน้าในแต่ละระดับ">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">ความคืบหน้าในแต่ละระดับ</p>
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
            </div>

            {/* Side column (desktop only) */}
            <div className="hidden xl:flex xl:flex-col xl:w-[320px] xl:flex-shrink-0 space-y-5 sticky top-20">
              {/* Recent sessions preview */}
              {recentSessionsPreview.length > 0 && (
                <section className="bg-surface border border-border rounded-xl p-4" aria-label="เซสชันล่าสุด">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">เซสชันล่าสุด</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("sessions")}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      ดูทั้งหมด
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSessionsPreview.map((session) => {
                      const sessionStage = mockTrainingStages.find((s) => s.id === session.stageId);
                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => setSelectedSession(session)}
                          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-bg dark:bg-white/3 border border-border text-left hover:border-primary/30 transition-all cursor-pointer"
                        >
                          <span className="text-base flex-shrink-0" aria-hidden="true">{sessionStage?.icon ?? "🎯"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-text truncate">{sessionStage?.name ?? session.stageId}</p>
                            <p className="text-xs text-text-muted">{session.averageScore}% · ★ {session.starsEarned}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Rewards preview */}
              {rewardResult && (
                <Link
                  href="/rewards"
                  className="block group bg-surface border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  aria-label="ดูเหรียญตราและรางวัล"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/12 flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB347" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">รางวัลและเหรียญตรา</p>
                        <p className="text-xs text-text-muted">ได้รับ {rewardResult.earnedCount} / {rewardResult.totalBadges} เหรียญ</p>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-hover:text-primary transition-colors" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-lg font-bold text-secondary leading-none">★ {summary.starsEarned}</p>
                    <p className="text-xs text-text-muted">ดาวสะสม</p>
                  </div>
                </Link>
              )}

              {/* Latest observation note */}
              {latestNote && (
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className="block w-full text-left bg-surface border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  aria-label="ดูบันทึกล่าสุด"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">บันทึกล่าสุด</p>
                    <span className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">ดูทั้งหมด</span>
                  </div>
                  <p className="text-sm text-text line-clamp-3 leading-relaxed">{latestNote.content}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {(() => {
                      try { return new Date(latestNote.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" }); }
                      catch { return ""; }
                    })()}
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ SESSIONS TAB ══════════════ */}
      {activeTab === "sessions" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-text">ประวัติเซสชัน</h2>
            <p className="text-sm text-text-muted mt-0.5">คลิกที่แถวเพื่อดูรายละเอียด</p>
          </div>

          {summary.recentSessions.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-sm font-medium text-text mb-1">ยังไม่มีประวัติเซสชัน</p>
              <p className="text-xs text-text-muted mb-4">เริ่มฝึกเพื่อสร้างเซสชันแรก</p>
              <Link href="/training" className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all">
                ไปฝึกเลย
              </Link>
            </div>
          ) : (
            <section className="bg-surface border border-border rounded-xl p-5" aria-label="ประวัติเซสชันการฝึก">
              <div className="space-y-2">
                {summary.recentSessions.map((session) => {
                  const sessionStage = mockTrainingStages.find((s) => s.id === session.stageId);
                  const durationText = session.durationMs
                    ? Math.round(session.durationMs / 60000) > 0
                      ? `${Math.round(session.durationMs / 60000)} นาที`
                      : `${Math.round(session.durationMs / 1000)} วินาที`
                    : "—";
                  const sessDateStr = (() => {
                    try {
                      return new Date(session.startedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
                    } catch { return ""; }
                  })();
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSession(session)}
                      className="w-full flex items-center gap-3 bg-bg dark:bg-white/3 rounded-xl p-4 border border-border text-left hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${sessionStage?.accentColor ?? "#6C63FF"}15` }}
                        aria-hidden="true"
                      >
                        {sessionStage?.icon ?? "🎯"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text truncate">{sessionStage?.name ?? session.stageId}</p>
                        <p className="text-xs text-text-muted">{sessDateStr} · {durationText} · เสียง {session.targetSound}</p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className={`text-sm font-bold ${session.averageScore >= 70 ? "text-success" : "text-secondary"}`}>
                          {session.averageScore}%
                        </p>
                        <p className="text-xs text-secondary">★ {session.starsEarned}</p>
                        <p className="text-xs text-text-muted">{session.completedMissions}/{session.totalMissions} ภารกิจ</p>
                      </div>
                      {session.status === "abandoned" && (
                        <span className="text-xs text-text-muted bg-gray-100 dark:bg-white/8 px-2 py-0.5 rounded-full flex-shrink-0">ยังไม่เสร็จ</span>
                      )}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted flex-shrink-0 ml-1" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  );
                })}
              </div>

              {summary.totalSessions > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="bg-bg dark:bg-white/3 rounded-xl p-3 text-center border border-border">
                    <p className="text-lg font-bold text-primary">{summary.totalSessions}</p>
                    <p className="text-xs text-text-muted">เซสชันทั้งหมด</p>
                  </div>
                  <div className="bg-bg dark:bg-white/3 rounded-xl p-3 text-center border border-border">
                    <p className="text-lg font-bold text-success">{summary.averageSessionScore}%</p>
                    <p className="text-xs text-text-muted">คะแนนเฉลี่ย</p>
                  </div>
                  <div className="bg-bg dark:bg-white/3 rounded-xl p-3 text-center border border-border">
                    <p className="text-lg font-bold text-secondary">
                      ★ {summary.recentSessions.reduce((s, sess) => s + sess.starsEarned, 0)}
                    </p>
                    <p className="text-xs text-text-muted">ดาวจากเซสชัน</p>
                  </div>
                </div>
              )}
            </section>
          )}
          <div className="pb-4" />
        </div>
      )}

      {/* ══════════════ ATTEMPTS TAB ══════════════ */}
      {activeTab === "attempts" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-text">ประวัติการฝึก</h2>
            <p className="text-sm text-text-muted mt-0.5">คลิกที่แถวเพื่อดูรายละเอียด</p>
          </div>
          <RecentAttemptsList
            attempts={summary.recentAttempts}
            onAttemptClick={setSelectedAttempt}
          />
          <div className="pb-4" />
        </div>
      )}

      {/* ══════════════ NOTES TAB ══════════════ */}
      {activeTab === "notes" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-text">บันทึกจากผู้ปกครอง / ครู</h2>
            <p className="text-sm text-text-muted mt-0.5">บันทึกสิ่งที่สังเกตเห็นระหว่างการฝึก</p>
          </div>
          <section className="bg-surface border border-border rounded-xl p-5" aria-label="บันทึกของผู้ปกครองและครู">
            <ObservationNoteList
              notes={notes}
              onAdd={addNote}
              onEdit={updateNote}
              onDelete={deleteNote}
            />
          </section>
          <div className="pb-4" />
        </div>
      )}

      {/* ══════════════ REPORT TAB ══════════════ */}
      {activeTab === "report" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text">รายงานสำหรับผู้ปกครอง</h2>
              {dateStr && <p className="text-sm text-text-muted mt-0.5">ข้อมูล ณ {dateStr}</p>}
            </div>
            <Link
              href="/report"
              className="flex-shrink-0 text-sm font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-xl hover:bg-primary/8 transition-all border border-primary/20"
            >
              รายงานฉบับเต็ม →
            </Link>
          </div>

          {/* Difficult items */}
          <section className="bg-surface border border-border rounded-xl p-5" aria-label="รายการที่ต้องฝึกเพิ่ม">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">รายการที่ต้องฝึกเพิ่ม</p>
            {summary.difficultItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-text-muted">
                  {hasData ? "ยังไม่มีรายการที่ยาก ทำได้ดีมากค่ะ!" : "เริ่มฝึกเพื่อดูรายการที่ควรฝึกเพิ่ม"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.difficultItems.map((item) => (
                  <div key={item.practiceItemId} className="flex items-start gap-4 bg-secondary/5 border border-secondary/15 rounded-xl p-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-secondary/12 flex items-center justify-center">
                      <span className="text-xs font-bold text-secondary leading-none">{item.averageScore}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text text-sm">{item.promptText}</p>
                      <p className="text-xs text-text-muted mt-0.5">ฝึก {item.attempts} ครั้ง · คะแนนเฉลี่ย {item.averageScore}%</p>
                      <p className="text-xs text-secondary mt-1.5">ลองฟังเสียงตัวอย่างแล้วออกเสียงช้าๆ ทีละพยางค์</p>
                    </div>
                  </div>
                ))}
                <div className="bg-info/8 border border-info/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-info mb-1">คำแนะนำสำหรับผู้ปกครอง</p>
                  <p className="text-sm text-text leading-relaxed">
                    ฝึกคำยากๆ ซ้ำๆ วันละ 5–10 ครั้ง โดยออกเสียงช้าๆ แล้วค่อยเพิ่มความเร็วขึ้น
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Auto report card */}
          <section
            className="bg-surface border border-primary/15 rounded-xl p-5"
            style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.04) 0%, transparent 60%)" }}
            aria-label="รายงานสำหรับผู้ปกครอง"
          >
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-text">สรุปผลอัตโนมัติ</h3>
            </div>
            <div className="bg-bg dark:bg-white/4 border border-border rounded-xl p-4 mb-4">
              <p className="font-semibold text-text">{report.headline}</p>
            </div>
            {report.details.length > 0 && (
              <ul className="space-y-2 mb-4">
                {report.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text">
                    <span className="text-primary flex-shrink-0 mt-0.5 font-bold">·</span>
                    {d}
                  </li>
                ))}
              </ul>
            )}
            {report.strengths.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-success uppercase tracking-wide mb-2">จุดแข็ง</p>
                <ul className="space-y-1.5">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-primary/8 border border-primary/15 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary mb-1.5">คำแนะนำ</p>
              <p className="text-sm text-text leading-relaxed">{report.recommendation}</p>
            </div>
            <p className="text-xs text-text-muted text-center mt-4">
              * ผลประเมินนี้เป็นข้อมูลสาธิต (Mock Evaluation)
            </p>
          </section>

          {/* Demo / Presentation Controls */}
          <section
            className="rounded-2xl border border-dashed border-primary/30 bg-primary/4 dark:bg-primary/6 p-5 pb-6"
            aria-label="ส่วนควบคุมโหมดสาธิต"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-primary">โหมดนำเสนอ</p>
                <p className="text-xs text-text-muted">สำหรับสาธิตและนำเสนอโปรเจกต์</p>
              </div>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              กดปุ่ม <strong className="text-text">โหลดข้อมูลสาธิต</strong> เพื่อดูตัวอย่างรายงานความก้าวหน้าที่สมบูรณ์
              ({DEMO_ATTEMPT_COUNT} ครั้ง ครอบคลุม 7 ระดับ)
            </p>

            {showDemoConfirm && (
              <div className="bg-surface border border-secondary/30 rounded-xl p-4 mb-4 text-center">
                <p className="text-sm font-semibold text-text mb-1">แทนที่ข้อมูลปัจจุบันด้วยข้อมูลสาธิต?</p>
                <p className="text-xs text-text-muted mb-4">ข้อมูลการฝึกที่มีอยู่ {summary.totalAttempts} ครั้งจะถูกแทนที่</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowDemoConfirm(false)} className="px-5 py-2 rounded-xl border border-border text-text-muted font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all">ยกเลิก</button>
                  <button onClick={handleConfirmLoadDemo} className="px-5 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all">โหลดเลย</button>
                </div>
              </div>
            )}
            {showResetConfirm && (
              <div className="bg-surface border border-error/25 rounded-xl p-4 mb-4 text-center">
                <p className="text-sm font-semibold text-text mb-1">ล้างข้อมูลความก้าวหน้าทั้งหมด?</p>
                <p className="text-xs text-text-muted mb-4">การกระทำนี้ไม่สามารถยกเลิกได้</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowResetConfirm(false)} className="px-5 py-2 rounded-xl border border-border text-text-muted font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all">ยกเล็ก</button>
                  <button onClick={handleReset} className="px-5 py-2 rounded-xl bg-error text-white font-semibold text-sm hover:bg-error/90 transition-all">ล้างข้อมูล</button>
                </div>
              </div>
            )}

            {!showDemoConfirm && !showResetConfirm && (
              <div className="flex gap-3">
                <button
                  onClick={handleLoadDemo}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  โหลดข้อมูลสาธิต
                </button>
                <button
                  onClick={() => { setShowDemoConfirm(false); setShowResetConfirm(true); }}
                  disabled={!isHydrated || summary.totalAttempts === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-error/40 text-error font-semibold text-sm hover:bg-error/8 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                  ล้างข้อมูล
                </button>
              </div>
            )}
          </section>
          <div className="pb-4" />
        </div>
      )}

      {/* ── Detail Drawers (rendered outside tab panels) ── */}
      <SessionDetailDrawer
        session={selectedSession}
        allAttempts={progress.attempts}
        onClose={() => setSelectedSession(null)}
        onAttemptClick={(attempt) => setSelectedAttempt(attempt)}
      />
      <AttemptDetailDrawer
        attempt={selectedAttempt}
        linkedSession={
          selectedAttempt?.sessionId
            ? (progress.sessions.find((s) => s.id === selectedAttempt.sessionId) ?? null)
            : null
        }
        onClose={() => setSelectedAttempt(null)}
        onSessionClick={(session) => {
          setSelectedAttempt(null);
          setSelectedSession(session);
        }}
      />
    </AppShell>
  );
}
