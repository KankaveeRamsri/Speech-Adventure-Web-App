"use client";

import { useState } from "react";
import Link from "next/link";
import ChildProfileCard from "@/components/speech-adventure/ChildProfileCard";
import RecentAttemptsList from "@/components/speech-adventure/RecentAttemptsList";
import StageProgressCard from "@/components/speech-adventure/StageProgressCard";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import {
  mockChildProfile,
  mockTrainingStages,
} from "@/data/speechAdventureMockData";

export default function ProgressDashboardPage() {
  const { summary, clearProgress, getStageStatus } = useSpeechProgress();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const liveProfile = {
    ...mockChildProfile,
    currentStage: summary.currentStageId,
    totalStars: summary.starsEarned,
    totalAttempts: summary.totalAttempts,
  };

  const handleReset = () => {
    clearProgress();
    setShowResetConfirm(false);
  };

  return (
    <main className="min-h-screen bg-bg">
      {/* Top Bar */}
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
          <h1 className="font-bold text-text">📊 ความก้าวหน้า</h1>
          <Link
            href="/training"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            🗺️ แผนที่การฝึก
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-text">สรุปความก้าวหน้า</h2>
          <p className="text-sm text-text-muted">สำหรับผู้ปกครองและคุณครู</p>
        </div>

        {/* Child Profile */}
        <ChildProfileCard profile={liveProfile} />

        {/* Progress Summary */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text mb-4">
            📊 สรุปความก้าวหน้า
          </h3>

          {/* Pretest vs Review Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-level-pretest/10 rounded-2xl p-4 text-center">
              <p className="text-sm text-text-muted mb-1">คะแนน Pre-test</p>
              <p className="text-3xl font-bold text-level-pretest">
                {summary.pretestScore || "—"}
              </p>
            </div>
            <div className="bg-success/10 rounded-2xl p-4 text-center">
              <p className="text-sm text-text-muted mb-1">คะแนน Review</p>
              <p className="text-3xl font-bold text-success">
                {summary.reviewScore || "—"}
              </p>
            </div>
          </div>

          {/* Improvement indicator */}
          {summary.improvement > 0 && (
            <div className="bg-success/10 rounded-2xl p-4 mb-6 text-center">
              <p className="text-sm text-text-muted">พัฒนาการ</p>
              <p className="text-2xl font-bold text-success">
                +{summary.improvement} คะแนน
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-bg rounded-2xl p-3">
              <p className="text-xs text-text-muted">ระดับปัจจุบัน</p>
              <p className="text-sm font-semibold text-text">
                {summary.currentLevel}
              </p>
            </div>
            <div className="bg-bg rounded-2xl p-3">
              <p className="text-xs text-text-muted">ดาวทั้งหมด</p>
              <p className="text-sm font-semibold text-secondary">
                ⭐ {summary.starsEarned}
              </p>
            </div>
            <div className="bg-bg rounded-2xl p-3">
              <p className="text-xs text-text-muted">จำนวนครั้งที่ฝึก</p>
              <p className="text-sm font-semibold text-primary">
                {summary.totalAttempts} ครั้ง
              </p>
            </div>
            <div className="bg-bg rounded-2xl p-3">
              <p className="text-xs text-text-muted">คะแนนเฉลี่ย</p>
              <p className="text-sm font-semibold text-success">
                {summary.averageScore}%
              </p>
            </div>
          </div>

          {/* Difficult Sounds */}
          {summary.difficultSounds.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-text mb-2">
                เสียงที่ควรฝึกเพิ่มเติม
              </p>
              <div className="flex gap-2 flex-wrap">
                {summary.difficultSounds.map((sound) => (
                  <span
                    key={sound}
                    className="inline-flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    ⚠️ {sound}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stage Progress */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text mb-4">
            📍 ความคืบหน้าในแต่ละระดับ
          </h3>
          <div className="space-y-3">
            {mockTrainingStages.map((stage) => {
              const status = getStageStatus(stage.id);
              return (
                <StageProgressCard
                  key={stage.id}
                  stageName={stage.name}
                  stageIcon={stage.icon}
                  accentColor={stage.accentColor}
                  status={status}
                  starsEarned={
                    stage.starsEarned
                  }
                  starsTotal={stage.starsTotal}
                />
              );
            })}
          </div>
        </div>

        {/* Recent Practice History */}
        <RecentAttemptsList attempts={summary.recentAttempts} />

        {/* Reset Demo Progress */}
        <div className="text-center pt-4 pb-8">
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

          <div className="mt-6">
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
