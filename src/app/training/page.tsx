"use client";

import Link from "next/link";
import ChildProfileCard from "@/components/speech-adventure/ChildProfileCard";
import TargetSoundSelector from "@/components/speech-adventure/TargetSoundSelector";
import TrainingMap from "@/components/speech-adventure/TrainingMap";
import AppShell from "@/components/layout/AppShell";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import {
  mockChildProfile,
  mockTargetSounds,
  mockTrainingStages,
} from "@/data/speechAdventureMockData";
import type { TrainingStage } from "@/types/speechAdventure";
import { calculateRewards } from "@/lib/rewards/calculateRewards";

export default function TrainingMapPage() {
  const {
    progress,
    getStageStatus,
    getStageAttempts,
    summary,
    isHydrated,
    selectedSoundId,
    setSelectedSound,
  } = useSpeechProgress();
  const { profile, hasProfile } = useChildProfile();

  const liveStages: TrainingStage[] = mockTrainingStages.map((stage) => {
    const status = getStageStatus(stage.id);
    const stageAttempts = getStageAttempts(stage.id);
    const starsEarned = stageAttempts.reduce((sum, a) => sum + a.starsEarned, 0);
    return { ...stage, status, starsEarned };
  });

  const liveProfile = {
    ...mockChildProfile,
    name: profile?.name ?? mockChildProfile.name,
    nickname: profile ? profile.name.split(" ")[0] : mockChildProfile.nickname,
    age: profile?.age ?? mockChildProfile.age,
    currentStage: summary.currentStageId,
    totalStars: summary.starsEarned,
    totalAttempts: summary.totalAttempts,
  };

  const selectedSound = mockTargetSounds.find((s) => s.id === selectedSoundId);
  const currentStage = liveStages.find((s) => s.status === "current");
  const completedCount = liveStages.filter((s) => s.status === "completed").length;
  const rewardResult = isHydrated ? calculateRewards(progress) : null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Setup banner (shown when no profile is set) ── */}
        {isHydrated && !hasProfile && (
          <div className="flex items-center justify-between gap-3 bg-info/8 border border-info/25 rounded-xl px-4 py-3">
            <p className="text-sm text-text">
              <span className="font-semibold">ยังไม่ได้ตั้งค่าโปรไฟล์</span>
              <span className="text-text-muted ml-1.5">ตั้งค่าเพื่อบันทึกชื่อและเป้าหมายการฝึก</span>
            </p>
            <Link
              href="/onboarding"
              className="flex-shrink-0 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              ตั้งค่า →
            </Link>
          </div>
        )}

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
        <div className="relative">
          <ChildProfileCard
            profile={liveProfile}
            compact
            isHydrated={isHydrated}
          />
          {isHydrated && (
            <Link
              href="/onboarding"
              className="absolute top-2 right-2 text-xs text-text-muted hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/8"
            >
              {hasProfile ? "แก้ไข" : "ตั้งค่า"}
            </Link>
          )}
        </div>

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

        {/* ── Current stage Next Action card ── */}
        {isHydrated && currentStage && (
          <div
            className="flex items-center justify-between gap-4 rounded-xl px-5 py-4 border"
            style={{
              backgroundColor: `${currentStage.accentColor}10`,
              borderColor: `${currentStage.accentColor}30`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">{currentStage.icon}</span>
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">ขั้นต่อไปที่แนะนำ</p>
                <p className="font-bold text-text text-sm">{currentStage.name}</p>
                <p className="text-xs text-text-muted">{currentStage.shortGoal}</p>
              </div>
            </div>
            <a
              href={`/training/${currentStage.slug}`}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: currentStage.accentColor }}
            >
              ฝึกเลย
            </a>
          </div>
        )}

        {/* ── Rewards mini-card ── */}
        {isHydrated && rewardResult && rewardResult.earnedCount > 0 && (
          <Link
            href="/rewards"
            className="flex items-center justify-between gap-4 bg-surface border border-border rounded-xl px-4 py-3 hover:border-secondary/40 hover:shadow-sm transition-all group"
            aria-label="ดูรางวัลและเหรียญตรา"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-secondary/12 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFB347" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">รางวัล</p>
                <p className="text-xs text-text-muted">
                  {rewardResult.earnedCount} / {rewardResult.totalBadges} เหรียญตรา
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <p className="text-sm font-bold text-secondary">★ {summary.starsEarned}</p>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-hover:text-secondary transition-colors" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        )}

        {/* ── Training Journey Map ── */}
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
            เส้นทางทั้งหมด
          </h2>
          <TrainingMap stages={liveStages} />
        </div>

        <div className="pb-4" />
      </div>
    </AppShell>
  );
}
