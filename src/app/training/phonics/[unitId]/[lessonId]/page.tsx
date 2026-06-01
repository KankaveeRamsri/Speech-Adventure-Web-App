"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import PhonicsActivityRenderer from "@/components/phonics/PhonicsActivityRenderer";
import { getPhonicsUnit, getPhonicsLesson } from "@/data/kindergartenCurriculum";

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

type Phase = "activity" | "summary";

interface ItemResult {
  itemId: string;
  passed: boolean;
}

// ── Summary screen ────────────────────────────────────────────────────────────

function SummaryScreen({
  lessonTitle,
  results,
  onRetry,
}: {
  lessonTitle: string;
  results: ItemResult[];
  onRetry: () => void;
}) {
  const router = useRouter();
  const passedCount = results.filter((r) => r.passed).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((passedCount / total) * 100) : 0;

  const emoji = pct === 100 ? "🌟" : pct >= 70 ? "⭐" : "💪";
  const headline =
    pct === 100 ? "เยี่ยมมาก!" : pct >= 70 ? "ทำได้ดีมาก!" : "ไม่เป็นไรค่ะ ลองอีกครั้งนะ";

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 py-3 max-w-lg mx-auto">
          <Link
            href="/training"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
          >
            <BackIcon />
            <span className="text-sm font-medium hidden sm:inline">สวนเสียง</span>
          </Link>
          <span className="text-sm font-semibold text-text truncate max-w-[180px]">{lessonTitle}</span>
          <ThemeToggle />
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="text-7xl" aria-hidden="true">{emoji}</div>

          <div>
            <h2 className="text-2xl font-bold text-text">{headline}</h2>
            <p className="text-text-muted mt-1 text-sm">
              ผ่าน {passedCount} จาก {total} กิจกรรม
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/training")}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold text-base hover:bg-amber-600 transition-all shadow-sm shadow-amber-300/40 active:scale-[0.98]"
            >
              กลับไปสวนเสียง 🌟
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="w-full py-3 rounded-xl border border-border text-text-muted hover:text-text hover:border-amber-400/60 font-medium text-sm transition-all active:scale-[0.98]"
            >
              ลองบทเรียนนี้อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PhonicsLessonPage() {
  const params = useParams();
  const unitId = params.unitId as string;
  const lessonId = params.lessonId as string;

  const unit = getPhonicsUnit(unitId);
  const lesson = unit ? getPhonicsLesson(unitId, lessonId) : undefined;

  const [phase, setPhase] = useState<Phase>("activity");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);

  const resetLesson = () => {
    setPhase("activity");
    setCurrentIndex(0);
    setResults([]);
  };

  // ── Not found ──
  if (!unit || !lesson) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10 gap-4">
        <p className="text-text font-semibold">ไม่พบบทเรียนนี้</p>
        <Link
          href="/training"
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-all"
        >
          กลับไปสวนเสียง
        </Link>
      </main>
    );
  }

  const items = lesson.items;
  const totalItems = items.length;

  // ── Summary ──
  if (phase === "summary") {
    return (
      <SummaryScreen
        lessonTitle={lesson.title}
        results={results}
        onRetry={resetLesson}
      />
    );
  }

  // ── Activity ──
  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  const handleComplete = (passed: boolean) => {
    const next = [...results, { itemId: currentItem.id, passed }];
    setResults(next);
    if (currentIndex + 1 >= totalItems) {
      setPhase("summary");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 py-3 max-w-lg mx-auto">
          <Link
            href="/training"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
          >
            <BackIcon />
            <span className="text-sm font-medium hidden sm:inline">สวนเสียง</span>
          </Link>

          <div className="text-center min-w-0 px-2">
            <p className="text-sm font-semibold text-text truncate">{lesson.title}</p>
            <p className="text-xs text-text-muted">
              {unit.id} · กิจกรรม {currentIndex + 1}/{totalItems}
            </p>
          </div>

          <ThemeToggle />
        </div>
      </nav>

      {/* ── Progress dots ── */}
      <div className="flex justify-center gap-1.5 py-3 px-6">
        {items.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentIndex
                ? "w-3 bg-amber-400"
                : i === currentIndex
                ? "w-6 bg-amber-500"
                : "w-3 bg-border"
            }`}
          />
        ))}
      </div>

      {/* ── Activity card ── */}
      <div className="flex-1 flex items-start justify-center px-6 py-6">
        <div className="w-full max-w-md">
          {/* Card header */}
          <div className="mb-5 px-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-md">
                {unit.id}
              </span>
              <span className="text-xs text-text-muted">{unit.title}</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl px-6 py-8 shadow-sm">
            <PhonicsActivityRenderer
              key={`${currentItem.id}-${currentIndex}`}
              item={currentItem}
              onComplete={handleComplete}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
