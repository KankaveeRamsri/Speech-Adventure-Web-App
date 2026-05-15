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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Setup banner ── */}
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

        {/* ── Page Header ── */}
        <header>
          <nav className="text-xs text-text-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">หน้าหลัก</Link>
            <span className="mx-1.5 text-disabled">/</span>
            <span className="text-text font-medium">ฝึกออกเสียง</span>
          </nav>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-text">ฝึกออกเสียง</h1>
              <p className="text-sm text-text-muted mt-0.5">
                เลือกเสียงเป้าหมายและระดับที่ต้องการฝึก
              </p>
            </div>
            {isHydrated && (
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="font-bold text-primary text-lg leading-none">{completedCount}<span className="text-text-muted text-xs font-normal">/7</span></p>
                  <p className="text-xs text-text-muted">ระดับผ่าน</p>
                </div>
                {currentStage && (
                  <a
                    href={`/training/${currentStage.slug}`}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                    style={{ backgroundColor: currentStage.accentColor }}
                  >
                    ฝึกต่อ →
                  </a>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── 2-Column Layout ── */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">

          {/* ── Left Column: Sound Selector + Journey Map ── */}
          <div className="space-y-5 min-w-0">
            <TargetSoundSelector
              sounds={mockTargetSounds}
              selectedId={isHydrated ? selectedSoundId : null}
              onSelect={setSelectedSound}
            />

            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
                เส้นทางการฝึก
              </h2>
              <TrainingMap stages={liveStages} />
            </section>
          </div>

          {/* ── Right Column: Side Panel ── */}
          <aside className="space-y-4 lg:sticky lg:top-16">

            {/* Child Profile */}
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

            {/* Selected Sound Summary */}
            {isHydrated && selectedSound && (
              <div className="flex items-center gap-3 bg-primary/6 border border-primary/15 rounded-xl px-4 py-3">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-primary flex-shrink-0"
                  style={{ backgroundColor: "rgba(108,99,255,0.10)" }}
                >
                  {selectedSound.label}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    เสียง /{selectedSound.label}/
                  </p>
                  <p className="text-xs text-text-muted truncate">{selectedSound.description}</p>
                </div>
              </div>
            )}

            {/* Next Best Action */}
            {isHydrated && currentStage && (
              <div
                className="rounded-xl px-4 py-3.5 border"
                style={{
                  backgroundColor: `${currentStage.accentColor}08`,
                  borderColor: `${currentStage.accentColor}25`,
                }}
              >
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">ขั้นต่อไปที่แนะนำ</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0" aria-hidden="true">{currentStage.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text text-sm leading-snug">{currentStage.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{currentStage.shortGoal}</p>
                  </div>
                </div>
                <a
                  href={`/training/${currentStage.slug}`}
                  className="block w-full text-center mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.98]"
                  style={{ backgroundColor: currentStage.accentColor }}
                >
                  ฝึกเลย
                </a>
              </div>
            )}

            {/* Rewards Summary */}
            {isHydrated && rewardResult && rewardResult.earnedCount > 0 && (
              <Link
                href="/rewards"
                className="flex items-center justify-between gap-3 bg-surface border border-border rounded-xl px-4 py-3 hover:border-secondary/40 hover:shadow-sm transition-all group"
                aria-label="ดูรางวัลและเหรียญตรา"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-secondary/12 flex items-center justify-center flex-shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFB347" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text leading-tight">รางวัล</p>
                    <p className="text-xs text-text-muted">
                      {rewardResult.earnedCount}/{rewardResult.totalBadges} เหรียญ
                    </p>
                  </div>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-hover:text-secondary transition-colors flex-shrink-0" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            )}

            {/* Quick stats on mobile (hidden on desktop since sidebar shows them) */}
            {!isHydrated && (
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-sm text-text-muted">กำลังโหลดข้อมูล...</p>
              </div>
            )}
          </aside>
        </div>

        <div className="pb-4" />
      </div>
    </AppShell>
  );
}
