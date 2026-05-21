"use client";

import Link from "next/link";
import { useChildProfile } from "@/hooks/useChildProfile";

/** Mini mock UI card — imitates the practice card in the actual app */
function MockPracticeCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden w-full max-w-xs">
      {/* Top bar */}
      <div className="bg-primary/10 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-gentle" />
          <span className="text-xs font-semibold text-primary">ระดับที่ 4 · ฝึกออกเสียง</span>
        </div>
        <span className="text-xs text-text-muted">ก → กา</span>
      </div>

      {/* Content */}
      <div className="px-5 py-5">
        {/* Target word */}
        <div className="text-center mb-5">
          <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">คำเป้าหมาย</p>
          <p className="text-4xl font-bold text-text tracking-wide">กา</p>
          <p className="text-sm text-text-muted mt-1">kaa · อีกา</p>
        </div>

        {/* Waveform visualizer mock */}
        <div className="bg-bg border border-border rounded-xl px-4 py-3 mb-4 flex items-center gap-1 justify-center h-12">
          {[3, 8, 5, 12, 7, 15, 9, 6, 13, 4, 10, 7, 3].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-primary/40"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        {/* Record button */}
        <button className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          กดเพื่ออัดเสียง
        </button>
      </div>

      {/* AI evaluation mock */}
      <div className="border-t border-border px-4 py-3 bg-success/5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">AI ประเมินล่าสุด</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-xs font-semibold text-success">92 / 100</span>
          </div>
        </div>
        <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full w-[92%] bg-gradient-to-r from-success to-emerald-400 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Mini progress widget mock */
function MockProgressWidget() {
  const stages = [
    { name: "Pre-test", done: true, color: "bg-level-pretest" },
    { name: "Oral Motor", done: true, color: "bg-level-oral" },
    { name: "Sound Fam.", done: true, color: "bg-level-sound-fam" },
    { name: "Sound Prod.", done: false, color: "bg-level-sound-prod", active: true },
    { name: "Word", done: false, color: "bg-border" },
    { name: "Sentence", done: false, color: "bg-border" },
  ];

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-lg overflow-hidden w-full max-w-[200px]">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-text">ความก้าวหน้า</p>
        <p className="text-xs text-text-muted">น้องแพร · เสียง ก</p>
      </div>
      <div className="px-4 py-3 space-y-2">
        {stages.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.active ? "animate-pulse-gentle " + s.color : s.color}`} />
            <span className={`text-xs ${s.done ? "text-text line-through opacity-60" : s.active ? "text-text font-semibold" : "text-text-muted"}`}>
              {s.name}
            </span>
            {s.done && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-success ml-auto flex-shrink-0" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {s.active && (
              <span className="ml-auto text-[10px] font-bold text-level-sound-prod bg-level-sound-prod/15 rounded px-1">ฝึกอยู่</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroSectionV2() {
  const { hasProfile } = useChildProfile();

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 px-8 py-14 md:px-16 md:py-20 text-white"
      aria-labelledby="hero-heading"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-white/30" />
        <div className="absolute bottom-1/3 right-12 w-2 h-2 rounded-full bg-violet-300/50" />
        {/* Grid dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
      </div>

      {/* Layout: left text + right product preview */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-12">
        {/* ── Left: copy ── */}
        <div className="flex-1 max-w-lg">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-gentle flex-shrink-0" />
            ระบบฝึกพูดสำหรับเด็กไทย · AI-Assisted
          </div>

          {/* Headline */}
          <h1 id="hero-heading" className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
            ฝึกออกเสียง
            <br />
            <span className="text-violet-200">อย่างเป็นระบบ</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base md:text-lg text-white/80 mb-3 leading-relaxed">
            แพลตฟอร์มฝึกพูดพยัญชนะไทยสำหรับเด็ก ตั้งแต่การฝึกกล้ามเนื้อปาก (Oral Motor)
            จนถึงการสื่อสารในประโยค ผ่านเส้นทาง 7 ระดับที่ออกแบบโดยผู้เชี่ยวชาญ
          </p>
          <p className="text-sm text-white/60 mb-8">
            พร้อมระบบบันทึกเสียง · AI ช่วยประเมิน · Dashboard สำหรับผู้ปกครอง
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            {hasProfile ? (
              <>
                <Link
                  href="/training"
                  className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-violet-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20"
                >
                  ฝึกต่อเลย →
                </Link>
                <Link
                  href="/progress"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-white/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  ดูความก้าวหน้า
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-violet-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20"
                >
                  เริ่มฝึกฟรี →
                </Link>
                <Link
                  href="/training"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-white/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  ดูตัวอย่างระบบ
                </Link>
              </>
            )}
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              "✓ ไม่ต้องสมัครสมาชิก",
              "✓ ใช้งานฟรี",
              "✓ บันทึกข้อมูลในเครื่อง",
            ].map((t) => (
              <span key={t} className="text-xs text-white/60">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Right: product preview ── */}
        <div className="flex-shrink-0 hidden lg:flex items-end gap-4 opacity-95">
          <div className="transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
            <MockPracticeCard />
          </div>
          <div className="transform rotate-[3deg] hover:rotate-0 transition-transform duration-500 mb-8">
            <MockProgressWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
