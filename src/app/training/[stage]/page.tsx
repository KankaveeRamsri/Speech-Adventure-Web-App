"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import PracticeCard from "@/components/speech-adventure/PracticeCard";
import LevelCompletionSummary from "@/components/speech-adventure/LevelCompletionSummary";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import {
  mockPracticeItemsBySound,
  mockTrainingStages,
} from "@/data/speechAdventureMockData";
import type { PracticeAttempt } from "@/types/speechAdventure";

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

export default function PracticePage() {
  const params = useParams();
  const stageSlug = params.stage as string;
  const stage = mockTrainingStages.find((s) => s.slug === stageSlug);
  const { addAttempt, selectedSoundId, isHydrated } = useSpeechProgress();

  const soundContent =
    mockPracticeItemsBySound[selectedSoundId] ??
    mockPracticeItemsBySound["ก"] ??
    {};
  const items = soundContent[stageSlug] ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sessionAttempts, setSessionAttempts] = useState<PracticeAttempt[]>([]);

  const handleSaveAttempt = useCallback(
    (attempt: PracticeAttempt) => {
      addAttempt(attempt);
      setSessionAttempts((prev) => [...prev, attempt]);
    },
    [addAttempt]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowCompletion(true);
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setShowCompletion(false);
    setSessionAttempts([]);
  }, []);

  /* ── Not found ── */
  if (!stage) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text mb-2">ไม่พบระดับนี้</h1>
          <p className="text-text-muted text-sm mb-6">ระดับที่กำลังมองหาไม่มีอยู่ในระบบ</p>
          <Link
            href="/training"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all"
          >
            กลับแผนที่การฝึก
          </Link>
        </div>
      </main>
    );
  }

  /* ── No content for this sound ── */
  if (isHydrated && items.length === 0) {
    return (
      <main className="min-h-screen bg-bg">
        <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
            <Link href="/training" className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8">
              <BackIcon />
              <span className="text-sm font-medium hidden sm:inline">แผนที่</span>
            </Link>
            <h1 className="font-semibold text-text text-sm">{stage.name}</h1>
            <ThemeToggle />
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
            style={{ backgroundColor: `${stage.accentColor}15` }}
            aria-hidden="true"
          >
            {stage.icon}
          </div>
          <h2 className="text-xl font-bold text-text mb-2">ยังไม่มีภารกิจสำหรับเสียงนี้</h2>
          <p className="text-text-muted mb-1 text-sm">
            เสียง <strong className="text-primary">{selectedSoundId}</strong> ใน {stage.name} ยังอยู่ระหว่างเตรียม
          </p>
          <p className="text-sm text-text-muted mb-6">ลองเปลี่ยนเสียงที่ต้องการฝึกที่หน้าแผนที่</p>
          <Link
            href="/training"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all"
          >
            เปลี่ยนเสียงที่แผนที่
          </Link>
        </div>
      </main>
    );
  }

  const currentItem = items[currentIndex];
  const isLastMission = currentIndex === items.length - 1;
  const progressPercent = showCompletion
    ? 100
    : items.length > 0
    ? ((currentIndex + 1) / items.length) * 100
    : 0;

  return (
    <main className="min-h-screen bg-bg">
      {/* ── Top Bar ── */}
      <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
          <Link
            href="/training"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
            aria-label="กลับแผนที่การฝึก"
          >
            <BackIcon />
            <span className="text-sm font-medium hidden sm:inline">แผนที่</span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: `${stage.accentColor}20` }}
              aria-hidden="true"
            >
              {stage.icon}
            </span>
            <h1 className="font-semibold text-text text-sm hidden sm:block">{stage.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted tabular-nums">
              {showCompletion
                ? `${items.length}/${items.length}`
                : items.length > 0 ? `${currentIndex + 1}/${items.length}` : ""}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-white/8">
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, backgroundColor: stage.accentColor }}
          />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {showCompletion ? (
          <LevelCompletionSummary
            attempts={sessionAttempts}
            stage={stage}
            totalMissions={items.length}
            onRetry={handleRetry}
          />
        ) : (
          <>
            {/* ── Stage info + mission dots ── */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${stage.accentColor}18` }}
                  aria-hidden="true"
                >
                  {stage.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-text text-sm leading-tight">{stage.name}</h2>
                  <p className="text-xs text-text-muted truncate">{stage.shortGoal}</p>
                </div>

                <div className="ml-auto shrink-0 text-right space-y-0.5">
                  {isHydrated && (
                    <span
                      className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${stage.accentColor}18`, color: stage.accentColor }}
                    >
                      เสียง {selectedSoundId}
                    </span>
                  )}
                  {items.length > 0 && (
                    <p className="text-xs text-text-muted">
                      ภารกิจ{" "}
                      <span className="font-bold" style={{ color: stage.accentColor }}>
                        {currentIndex + 1}
                      </span>
                      {" / "}{items.length}
                    </p>
                  )}
                </div>
              </div>

              {/* Step dots */}
              {items.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {items.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i < currentIndex ? "w-3 h-2" : i === currentIndex ? "w-6 h-2" : "w-2 h-2"
                      } ${i > currentIndex ? "bg-gray-200 dark:bg-white/15" : ""}`}
                      style={
                        i <= currentIndex ? { backgroundColor: stage.accentColor } : undefined
                      }
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Practice card ── */}
            {currentItem && (
              <PracticeCard
                key={currentItem.id}
                item={currentItem}
                accentColor={stage.accentColor}
                stageName={stage.name}
                targetSound={selectedSoundId}
                missionIndex={currentIndex}
                totalMissions={items.length}
                isLastMission={isLastMission}
                onSaveAttempt={handleSaveAttempt}
                onNext={handleNext}
              />
            )}

            {/* ── Previous mission button ── */}
            {currentIndex > 0 && (
              <div className="flex justify-start">
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-text-muted hover:text-text hover:bg-surface dark:hover:bg-white/5 border border-transparent hover:border-border transition-all text-sm font-medium"
                >
                  <BackIcon />
                  ภารกิจก่อนหน้า
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
