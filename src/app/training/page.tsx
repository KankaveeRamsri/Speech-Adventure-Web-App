"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ChildProfileCard from "@/components/speech-adventure/ChildProfileCard";
import TargetSoundSelector from "@/components/speech-adventure/TargetSoundSelector";
import TrainingMap from "@/components/speech-adventure/TrainingMap";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import {
  mockChildProfile,
  mockTargetSounds,
  mockTrainingStages,
} from "@/data/speechAdventureMockData";
import type { TrainingStage } from "@/types/speechAdventure";

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

export default function TrainingMapPage() {
  const {
    getStageStatus,
    getStageAttempts,
    summary,
    isHydrated,
    selectedSoundId,
    setSelectedSound,
  } = useSpeechProgress();

  const liveStages: TrainingStage[] = mockTrainingStages.map((stage) => {
    const status = getStageStatus(stage.id);
    const stageAttempts = getStageAttempts(stage.id);
    const starsEarned = stageAttempts.reduce((sum, a) => sum + a.starsEarned, 0);
    return { ...stage, status, starsEarned };
  });

  const liveProfile = {
    ...mockChildProfile,
    currentStage: summary.currentStageId,
    totalStars: summary.starsEarned,
    totalAttempts: summary.totalAttempts,
  };

  const selectedSound = mockTargetSounds.find((s) => s.id === selectedSoundId);
  const currentStage = liveStages.find((s) => s.status === "current");
  const completedCount = liveStages.filter((s) => s.status === "completed").length;

  return (
    <main className="min-h-screen bg-bg">
      {/* ── Top Bar ── */}
      <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
            aria-label="กลับหน้าแรก"
          >
            <BackIcon />
            <span className="text-sm font-medium hidden sm:inline">กลับ</span>
          </Link>

          <h1 className="font-semibold text-text text-sm">แผนที่การฝึก</h1>

          <div className="flex items-center gap-1">
            <Link
              href="/progress"
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 px-2.5 py-1.5 rounded-lg hover:bg-primary/8 transition-all"
            >
              <ChartIcon />
              <span className="hidden sm:inline">รายงาน</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Session header ── */}
        <div className="bg-gradient-to-r from-primary/8 via-surface to-level-sentence/5 border border-border rounded-xl px-5 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-text text-base">Training Cockpit</h2>
              <p className="text-sm text-text-muted mt-0.5">
                เลือกเสียงและระดับที่ต้องการฝึก
              </p>
            </div>
            {isHydrated && (
              <div className="flex items-center gap-3 text-sm">
                <div className="text-center">
                  <p className="font-bold text-primary text-xl leading-none">{completedCount}</p>
                  <p className="text-xs text-text-muted">/ 7 ระดับ</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-bold text-secondary text-xl leading-none">★ {summary.starsEarned}</p>
                  <p className="text-xs text-text-muted">ดาว</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Child Profile (compact) ── */}
        <ChildProfileCard
          profile={liveProfile}
          compact
          isHydrated={isHydrated}
        />

        {/* ── Target Sound Selector ── */}
        <TargetSoundSelector
          sounds={mockTargetSounds}
          selectedId={isHydrated ? selectedSoundId : null}
          onSelect={setSelectedSound}
        />

        {/* ── Selected sound indicator ── */}
        {isHydrated && selectedSound && (
          <div className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold text-primary flex-shrink-0"
              style={{ backgroundColor: "rgba(108,99,255,0.12)" }}
            >
              {selectedSound.label}
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">
                กำลังฝึกเสียง: {selectedSound.description}
              </p>
              <p className="text-xs text-text-muted">เปลี่ยนเสียงได้จากด้านบน</p>
            </div>
          </div>
        )}

        {/* ── Current stage CTA ── */}
        {isHydrated && currentStage && (
          <div
            className="flex items-center justify-between gap-4 rounded-xl px-5 py-4 border"
            style={{
              backgroundColor: `${currentStage.accentColor}10`,
              borderColor: `${currentStage.accentColor}30`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentStage.icon}</span>
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">ระดับปัจจุบัน</p>
                <p className="font-bold text-text text-sm">{currentStage.name}</p>
                <p className="text-xs text-text-muted">{currentStage.shortGoal}</p>
              </div>
            </div>
            <a
              href={`/training/${currentStage.slug}`}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: currentStage.accentColor }}
            >
              ฝึกต่อ
            </a>
          </div>
        )}

        {/* ── Training Journey Map ── */}
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
            เส้นทางทั้งหมด
          </h2>
          <TrainingMap stages={liveStages} />
        </div>
      </div>
    </main>
  );
}
