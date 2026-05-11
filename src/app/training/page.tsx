"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function TrainingMapPage() {
  const [selectedSound, setSelectedSound] = useState<string | null>(
    mockTargetSounds.find((s) => s.isSelected)?.id ?? null
  );
  const { getStageStatus, getStageAttempts, summary, isHydrated } = useSpeechProgress();

  const liveStages: TrainingStage[] = mockTrainingStages.map((stage) => {
    const status = getStageStatus(stage.id);
    const stageAttempts = getStageAttempts(stage.id);
    const starsEarned = stageAttempts.reduce(
      (sum, a) => sum + a.starsEarned,
      0
    );

    return {
      ...stage,
      status,
      starsEarned,
    };
  });

  const liveProfile = {
    ...mockChildProfile,
    currentStage: summary.currentStageId,
    totalStars: summary.starsEarned,
    totalAttempts: summary.totalAttempts,
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
          <h1 className="font-bold text-text">🗺️ แผนที่การฝึก</h1>
          <Link
            href="/progress"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            📊 ความก้าวหน้า
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Child Profile */}
        <ChildProfileCard profile={liveProfile} compact isHydrated={isHydrated} />

        {/* Target Sound Selector */}
        <TargetSoundSelector
          sounds={mockTargetSounds}
          selectedId={selectedSound}
          onSelect={setSelectedSound}
        />

        {/* Training Journey Map */}
        <div>
          <h2 className="text-xl font-bold text-text mb-4">
            🗺️ เส้นทางการผจญภัย
          </h2>
          <TrainingMap stages={liveStages} />
        </div>
      </div>
    </main>
  );
}
