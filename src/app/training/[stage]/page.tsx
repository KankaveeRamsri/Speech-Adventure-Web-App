"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PracticeCard from "@/components/speech-adventure/PracticeCard";
import LevelCompletionSummary from "@/components/speech-adventure/LevelCompletionSummary";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import {
  mockPracticeItems,
  mockTrainingStages,
} from "@/data/speechAdventureMockData";
import type { PracticeAttempt } from "@/types/speechAdventure";

export default function PracticePage() {
  const params = useParams();
  const stageSlug = params.stage as string;

  const stage = mockTrainingStages.find((s) => s.slug === stageSlug);
  const items = mockPracticeItems[stageSlug] ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sessionAttempts, setSessionAttempts] = useState<PracticeAttempt[]>([]);
  const { addAttempt } = useSpeechProgress();

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

  if (!stage) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-6xl mb-4">🤔</p>
          <h1 className="text-2xl font-bold text-text mb-2">ไม่พบระดับนี้</h1>
          <p className="text-text-muted mb-6">
            ระดับที่น้องกำลังมองหาไม่มีอยู่
          </p>
          <Link
            href="/training"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-all"
          >
            ← กลับแผนที่การฝึก
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-6xl mb-4">🔧</p>
          <h1 className="text-2xl font-bold text-text mb-2">
            ยังไม่มีภารกิจ
          </h1>
          <p className="text-text-muted mb-6">
            ระดับนี้ยังอยู่ระหว่างการเตรียมภารกิจ
          </p>
          <Link
            href="/training"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-all"
          >
            ← กลับแผนที่การฝึก
          </Link>
        </div>
      </main>
    );
  }

  const currentItem = items[currentIndex];
  const isLastMission = currentIndex === items.length - 1;
  const progressPercent = showCompletion
    ? 100
    : ((currentIndex + 1) / items.length) * 100;

  return (
    <main className="min-h-screen bg-bg">
      {/* Top Bar */}
      <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
          <Link
            href="/training"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
            aria-label="กลับแผนที่การฝึก"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium hidden sm:inline">
              แผนที่การฝึก
            </span>
          </Link>
          <h1 className="font-bold text-text text-sm sm:text-base">
            {stage.icon} {stage.name}
          </h1>
          <span className="text-sm font-medium text-text-muted">
            {showCompletion
              ? `✓ ${items.length}/${items.length}`
              : `${currentIndex + 1}/${items.length}`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: stage.accentColor,
            }}
          />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {showCompletion ? (
          /* ── Level completion summary ── */
          <LevelCompletionSummary
            attempts={sessionAttempts}
            stage={stage}
            totalMissions={items.length}
            onRetry={handleRetry}
          />
        ) : (
          <>
            {/* ── Level info + step dots ── */}
            <div className="bg-surface rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${stage.accentColor}20` }}
                  aria-hidden="true"
                >
                  {stage.icon}
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold text-text leading-tight">
                    {stage.name}
                  </h2>
                  <p className="text-sm text-text-muted truncate">
                    {stage.shortGoal}
                  </p>
                </div>
                {/* Mission counter badge */}
                <div
                  className="ml-auto shrink-0 rounded-2xl px-4 py-2 text-center"
                  style={{ backgroundColor: `${stage.accentColor}15` }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={{ color: stage.accentColor }}
                  >
                    ภารกิจที่
                  </p>
                  <p
                    className="text-xl font-bold leading-tight"
                    style={{ color: stage.accentColor }}
                  >
                    {currentIndex + 1}
                    <span className="text-sm font-normal text-text-muted">
                      {" "}
                      / {items.length}
                    </span>
                  </p>
                </div>
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {items.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i < currentIndex
                        ? "w-4"
                        : i === currentIndex
                          ? "w-7"
                          : "w-2"
                    }`}
                    style={{
                      backgroundColor:
                        i <= currentIndex ? stage.accentColor : "#E5E7EB",
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>

            {/* ── Practice card ── */}
            {currentItem && (
              <PracticeCard
                key={currentItem.id}
                item={currentItem}
                accentColor={stage.accentColor}
                stageName={stage.name}
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-text-muted hover:text-text hover:bg-surface transition-all text-sm font-medium"
                >
                  ← ภารกิจก่อนหน้า
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
