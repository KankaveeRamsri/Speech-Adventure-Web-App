"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  mockTargetSounds,
  mockTrainingStages,
  mockPracticeItemsBySound,
} from "@/data/speechAdventureMockData";
import type { PracticeItem, PracticeItemType } from "@/types/speechAdventure";

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PracticeItemType, { label: string; skill: string }> = {
  test: { label: "แบบทดสอบ", skill: "ประเมินระดับเสียง" },
  oral_motor: { label: "กล้ามเนื้อปาก", skill: "เตรียมกล้ามเนื้อการพูด" },
  sound_choice: { label: "เลือกเสียง", skill: "จดจำและแยกแยะเสียง" },
  sound_production: { label: "ออกเสียง", skill: "ผลิตเสียงพยัญชนะ" },
  word: { label: "คำ", skill: "ออกเสียงคำ" },
  sentence: { label: "ประโยค", skill: "ออกเสียงประโยค" },
};

const STAGE_ORDER = [
  "pretest",
  "level-1",
  "level-2",
  "level-3",
  "level-4",
  "level-5",
  "review",
];

function getStageInfo(stageSlug: string) {
  return mockTrainingStages.find((s) => s.slug === stageSlug);
}

// ── Stage Content Card ─────────────────────────────────────────────────────────

function StageContentCard({
  soundId,
  stageSlug,
  items,
}: {
  soundId: string;
  stageSlug: string;
  items: PracticeItem[];
}) {
  const stage = getStageInfo(stageSlug);
  if (!stage) return null;

  const typeInfo = items.length > 0 ? TYPE_LABELS[items[0].type] : null;
  const samplePrompts = items.slice(0, 3).map((i) => i.target);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Stage header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-border"
        style={{ backgroundColor: `${stage.accentColor}08` }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: `${stage.accentColor}14` }}
        >
          <span style={{ color: stage.accentColor, fontSize: "14px" }}>
            {stage.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text leading-tight">{stage.name}</p>
          <p className="text-xs text-text-muted truncate">{stage.shortGoal}</p>
        </div>
        <Link
          href={`/training/${stage.slug}`}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: stage.accentColor }}
        >
          เริ่ม
        </Link>
      </div>

      {/* Content details */}
      <div className="px-4 py-3 space-y-2">
        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-text-muted">
            {items.length} ภารกิจ
          </span>
          {typeInfo && (
            <>
              <span className="text-text-muted/30" aria-hidden="true">·</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/6 text-xs font-medium text-text-muted">
                {typeInfo.label}
              </span>
            </>
          )}
          {typeInfo && (
            <>
              <span className="text-text-muted/30" aria-hidden="true">·</span>
              <span className="text-xs text-text-muted">{typeInfo.skill}</span>
            </>
          )}
          <span className="text-text-muted/30" aria-hidden="true">·</span>
          <span className="text-xs text-text-muted">
            {stage.starsTotal} ดาว
          </span>
        </div>

        {/* Sample prompts */}
        {samplePrompts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((prompt, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded-md bg-bg dark:bg-white/4 border border-border text-xs text-text"
              >
                {prompt}
              </span>
            ))}
            {items.length > 3 && (
              <span className="text-xs text-text-muted self-center">
                +{items.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <p className="text-xs text-text-muted/60 italic">
            ยังไม่มีเนื้อหาสำหรับระดับนี้
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sound Section ──────────────────────────────────────────────────────────────

function SoundSection({
  soundId,
  soundLabel,
  soundDescription,
  isDefault,
}: {
  soundId: string;
  soundLabel: string;
  soundDescription: string;
  isDefault: boolean;
}) {
  const content = mockPracticeItemsBySound[soundId];
  const totalItems = content
    ? STAGE_ORDER.reduce((sum, slug) => sum + (content[slug]?.length ?? 0), 0)
    : 0;

  return (
    <section aria-label={`เนื้อหาเสียง ${soundLabel}`}>
      {/* Sound header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary">{soundLabel}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text">
              เสียง /{soundLabel}/
            </h3>
            {isDefault && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                ปัจจุบัน
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">{soundDescription}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {totalItems} ภารกิจ · {STAGE_ORDER.length} ระดับ
          </p>
        </div>
      </div>

      {/* Stages grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {STAGE_ORDER.map((stageSlug) => {
          const items = content?.[stageSlug] ?? [];
          return (
            <StageContentCard
              key={`${soundId}-${stageSlug}`}
              soundId={soundId}
              stageSlug={stageSlug}
              items={items}
            />
          );
        })}
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [selectedSound, setSelectedSound] = useState<string | "all">("all");

  const soundsToShow =
    selectedSound === "all"
      ? mockTargetSounds
      : mockTargetSounds.filter((s) => s.id === selectedSound);

  const totalContent = mockTargetSounds.reduce(
    (sum, s) =>
      sum +
      STAGE_ORDER.reduce(
        (s2, slug) =>
          s2 + (mockPracticeItemsBySound[s.id]?.[slug]?.length ?? 0),
        0
      ),
    0
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page header */}
        <header>
          <nav className="text-xs text-text-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">
              หน้าหลัก
            </Link>
            <span className="mx-1.5 text-disabled">/</span>
            <span className="text-text font-medium">เนื้อหาการฝึก</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-text">
                เนื้อหาการฝึกทั้งหมด
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                เนื้อหา {totalContent} ภารกิจสำหรับ{" "}
                {mockTargetSounds.length} เสียงเป้าหมาย ·{" "}
                {STAGE_ORDER.length} ระดับ
              </p>
            </div>
            <Link
              href="/training"
              className="flex-shrink-0 inline-flex items-center gap-2 border border-primary text-primary font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary/8 transition-all active:scale-[0.98]"
            >
              ไปฝึก
            </Link>
          </div>
        </header>

        {/* Sound filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedSound("all")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedSound === "all"
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-white/8"
            }`}
          >
            ทั้งหมด
          </button>
          {mockTargetSounds.map((sound) => (
            <button
              key={sound.id}
              type="button"
              onClick={() => setSelectedSound(sound.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedSound === sound.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-white/8"
              }`}
            >
              เสียง {sound.label}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-text-muted mb-2">
              เสียงเป้าหมาย
            </p>
            <p className="text-2xl font-bold text-primary leading-none">
              {mockTargetSounds.length}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-text-muted mb-2">
              ระดับการฝึก
            </p>
            <p className="text-2xl font-bold text-info leading-none">
              {STAGE_ORDER.length}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-text-muted mb-2">
              ภารกิจทั้งหมด
            </p>
            <p className="text-2xl font-bold text-success leading-none">
              {totalContent}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-text-muted mb-2">
              ประเภทกิจกรรม
            </p>
            <p className="text-2xl font-bold text-secondary leading-none">
              {Object.keys(TYPE_LABELS).length}
            </p>
          </div>
        </div>

        {/* Sound sections */}
        <div className="space-y-8">
          {soundsToShow.map((sound) => (
            <SoundSection
              key={sound.id}
              soundId={sound.id}
              soundLabel={sound.label}
              soundDescription={sound.description}
              isDefault={sound.isSelected}
            />
          ))}
        </div>

        {/* Stage legend */}
        <section aria-label="คำอธิบายระดับ">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            คำอธิบายระดับ
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mockTrainingStages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-start gap-2.5 bg-surface border border-border rounded-xl p-3"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: stage.accentColor }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text leading-tight">
                    {stage.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 leading-snug">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity type legend */}
        <section aria-label="ประเภทกิจกรรม">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            ประเภทกิจกรรม
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              Object.entries(TYPE_LABELS) as [PracticeItemType, { label: string; skill: string }][]
            ).map(([type, info]) => (
              <div
                key={type}
                className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2"
              >
                <span className="text-xs font-semibold text-text">
                  {info.label}
                </span>
                <span className="text-text-muted/30" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-text-muted">{info.skill}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="pb-4" />
      </div>
    </AppShell>
  );
}
