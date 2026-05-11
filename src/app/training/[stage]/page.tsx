"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PracticeCard from "@/components/speech-adventure/PracticeCard";
import {
  mockPracticeItems,
  mockTrainingStages,
} from "@/data/speechAdventureMockData";

export default function PracticePage() {
  const params = useParams();
  const stageSlug = params.stage as string;

  const stage = mockTrainingStages.find((s) => s.slug === stageSlug);
  const items = mockPracticeItems[stageSlug] ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);

  if (!stage) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🤔</p>
          <h1 className="text-2xl font-bold text-text mb-2">ไม่พบระดับนี้</h1>
          <p className="text-text-muted mb-4">ระดับที่คุณกำลังมองหาไม่มีอยู่</p>
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
  const isLastItem = currentIndex >= items.length - 1;
  const progressPercent = ((currentIndex + 1) / items.length) * 100;

  const handleNext = () => {
    if (!isLastItem) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

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
            <span className="text-sm font-medium hidden sm:inline">แผนที่การฝึก</span>
          </Link>
          <h1 className="font-bold text-text text-sm sm:text-base">
            {stage.icon} {stage.name}
          </h1>
          <span className="text-sm text-text-muted">
            {currentIndex + 1}/{items.length}
          </span>
        </div>

        {/* Progress Bar */}
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

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Level Info */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${stage.accentColor}20` }}
              aria-hidden="true"
            >
              {stage.icon}
            </span>
            <div>
              <h2 className="font-bold text-text">{stage.name}</h2>
              <p className="text-sm text-text-muted">{stage.shortGoal}</p>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {items.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i < currentIndex
                    ? "w-4"
                    : i === currentIndex
                    ? "w-6"
                    : "w-2"
                }`}
                style={{
                  backgroundColor:
                    i < currentIndex
                      ? stage.accentColor
                      : i === currentIndex
                      ? stage.accentColor
                      : "#E5E7EB",
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Practice Card */}
        {currentItem && (
          <PracticeCard
            key={currentItem.id}
            item={currentItem}
            accentColor={stage.accentColor}
            stageName={stage.name}
            onNext={handleNext}
          />
        )}

        {/* Complete message */}
        {isLastItem && (
          <div className="bg-success/10 rounded-3xl p-6 text-center">
            <p className="text-4xl mb-2" aria-hidden="true">🎉</p>
            <p className="text-lg font-bold text-success">ยอดเยี่ยม! ทำภารกิจครบแล้ว!</p>
            <p className="text-sm text-text-muted mt-1">น้องได้ทำภารกิจทั้งหมดในระดับนี้เสร็จแล้ว</p>
            <Link
              href="/training"
              className="inline-flex items-center gap-2 mt-4 bg-primary text-white px-6 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-all"
            >
              🗺️ กลับแผนที่การฝึก
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
