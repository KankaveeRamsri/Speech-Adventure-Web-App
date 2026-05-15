"use client";

import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  mockTrainingStages,
  mockTargetSounds,
} from "@/data/speechAdventureMockData";
import { BADGE_DEFINITIONS } from "@/lib/rewards/rewardDefinitions";
import { loadDemoProgress } from "@/lib/demo/speechAdventureDemoData";
import { DEMO_ATTEMPT_COUNT } from "@/lib/demo/speechAdventureDemoData";

// ── Shared icon helper ─────────────────────────────────────────────────────────

function BadgeIcon({ iconPath, color, size = 18 }: { iconPath: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPath.split("M").filter(Boolean).map((segment, i) => (
        <path key={i} d={`M${segment}`} />
      ))}
    </svg>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        {label}
      </p>
      {children}
    </section>
  );
}

// ── Preview card ───────────────────────────────────────────────────────────────

function PreviewCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl p-5 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ── CTA button ─────────────────────────────────────────────────────────────────

function CtaButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
}) {
  const base =
    "inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? `${base} bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20`
      : `${base} border border-primary/30 text-primary hover:bg-primary/8`;
  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DemoShowcasePage() {
  const handleLoadDemo = () => {
    loadDemoProgress();
    window.location.href = "/progress";
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* ══════════════ Hero ══════════════ */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text">Speech Adventure</h1>
          <p className="text-lg text-text-muted max-w-xl mx-auto leading-relaxed">
            ระบบฝึกออกเสียงสำหรับเด็กไทย ออกแบบโดยทีมนักบำบัดการพูด
            ช่วยให้เด็กพัฒนาการออกเสียงพยัญชนะได้อย่างถูกต้องและมีความมั่นใจ
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <CtaButton href="/training">เริ่มฝึกเลย</CtaButton>
            <CtaButton href="/progress" variant="outline">ดูความก้าวหน้า</CtaButton>
          </div>
        </div>

        {/* ══════════════ Who it's for ══════════════ */}
        <Section id="audience" label="สำหรับใคร">
          <div className="grid gap-3 sm:grid-cols-3">
            <PreviewCard>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-text mb-1">เด็ก (4–10 ปี)</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                เด็กที่ต้องการพัฒนาการออกเสียงพยัญชนะภาษาไทยให้ชัดเจนขึ้น ผ่านกิจกรรมที่สนุกและเหมาะกับวัย
              </p>
            </PreviewCard>
            <PreviewCard>
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-text mb-1">ผู้ปกครอง</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                ติดตามพัฒนาการของบุตรหลานผ่านรายงานที่เข้าใจง่าย พร้อมบันทึกสังเกตการณ์ส่วนตัว
              </p>
            </PreviewCard>
            <PreviewCard>
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5BC0EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-text mb-1">นักบำบัดการพูด</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                ใช้เป็นเครื่องมือเสริมในการรักษา ดูรายงานผลฝึกแบบละเอียดและจุดที่ต้องเน้น
              </p>
            </PreviewCard>
          </div>
        </Section>

        {/* ══════════════ Training Journey ══════════════ */}
        <Section id="training" label="เส้นทางการฝึก">
          <PreviewCard className="space-y-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <h3 className="text-base font-bold text-text">7 ระดับ ตามลำดับความยาก</h3>
                <p className="text-sm text-text-muted mt-0.5">
                  เริ่มจากประเมิน → ฝึกทีละขั้น → วัดผลอีกครั้ง
                </p>
              </div>
              <CtaButton href="/training" variant="outline">ดูแผนที่ฝึก</CtaButton>
            </div>

            {/* Stage flow */}
            <div className="space-y-2">
              {mockTrainingStages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                      style={{ backgroundColor: `${stage.accentColor}14`, color: stage.accentColor }}
                    >
                      {i + 1}
                    </div>
                    {i < mockTrainingStages.length - 1 && (
                      <div className="w-px h-3 bg-border mt-1" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-3 bg-bg dark:bg-white/3 rounded-xl px-3 py-2.5 border border-border">
                    <span className="text-base flex-shrink-0" aria-hidden="true">{stage.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{stage.name}</p>
                      <p className="text-xs text-text-muted">{stage.shortGoal}</p>
                    </div>
                    <span className="text-xs text-text-muted flex-shrink-0">{stage.starsTotal} ดาว</span>
                  </div>
                </div>
              ))}
            </div>
          </PreviewCard>
        </Section>

        {/* ══════════════ Target Sounds ══════════════ */}
        <Section id="sounds" label="เสียงเป้าหมาย">
          <PreviewCard>
            <h3 className="text-base font-bold text-text mb-3">รองรับ 4 เสียงพยัญชนะ</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {mockTargetSounds.map((sound) => (
                <div
                  key={sound.id}
                  className="flex flex-col items-center bg-bg dark:bg-white/3 rounded-xl p-4 border border-border"
                >
                  <span className="text-2xl font-bold text-primary mb-1">{sound.label}</span>
                  <span className="text-xs text-text-muted">{sound.description}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-3">
              แต่ละเสียงมีเนื้อหาครบ 7 ระดับ รวม {mockTargetSounds.length * 7 * 5} ภารกิจ
            </p>
          </PreviewCard>
        </Section>

        {/* ══════════════ Practice Flow ══════════════ */}
        <Section id="practice" label="การฝึกแต่ละภารกิจ">
          <PreviewCard>
            <h3 className="text-base font-bold text-text mb-4">ขั้นตอนการฝึก</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { step: "1", title: "ดูคำสั่ง", desc: "อ่านหรือฟังคำสั่งของภารกิจ", color: "#A29BFE" },
                { step: "2", title: "อัดเสียง", desc: "กดปุ่มไมโครโฟนแล้วออกเสียง", color: "#6C63FF" },
                { step: "3", title: "รับผล", desc: "ระบบประเมินและให้ feedback ทันที", color: "#4CAF82" },
                { step: "4", title: "สะสมดาว", desc: "ได้รับดาวตามคะแนนที่ทำได้", color: "#FFB347" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-sm"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.step}
                  </div>
                  <p className="text-sm font-semibold text-text">{item.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </PreviewCard>
        </Section>

        {/* ══════════════ Progress Dashboard ══════════════ */}
        <Section id="progress" label="รายงานความก้าวหน้า">
          <PreviewCard>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-base font-bold text-text">Dashboard สำหรับผู้ปกครอง</h3>
              <CtaButton href="/progress" variant="outline">ดูหน้า Progress</CtaButton>
            </div>

            {/* Simulated stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              {[
                { label: "คะแนนเฉลี่ย", value: "73%", color: "text-success" },
                { label: "ครั้งที่ฝึก", value: "31", color: "text-info" },
                { label: "ดาวสะสม", value: "68", color: "text-secondary" },
                { label: "ระดับผ่าน", value: "5/7", color: "text-primary" },
              ].map((stat) => (
                <div key={stat.label} className="bg-bg dark:bg-white/3 border border-border rounded-xl p-3 text-center">
                  <p className="text-xs text-text-muted mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color} leading-none`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Pre-test vs Review comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-level-pretest/8 border border-level-pretest/20 rounded-xl p-3 text-center">
                <p className="text-xs font-medium text-level-pretest mb-1">Pre-test</p>
                <p className="text-2xl font-bold text-level-pretest">48%</p>
              </div>
              <div className="bg-success/8 border border-success/20 rounded-xl p-3 text-center">
                <p className="text-xs font-medium text-success mb-1">Review</p>
                <p className="text-2xl font-bold text-success">81%</p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-semibold">
                +33 คะแนนพัฒนาการ
              </span>
            </div>
          </PreviewCard>
        </Section>

        {/* ══════════════ Rewards ══════════════ */}
        <Section id="rewards" label="รางวัลและเหรียญตรา">
          <PreviewCard>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-text">10 เหรียญตรา</h3>
                <p className="text-sm text-text-muted mt-0.5">สร้างแรงบันดาลใจให้เด็กฝึกต่อเนื่อง</p>
              </div>
              <CtaButton href="/rewards" variant="outline">ดูรางวัล</CtaButton>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {BADGE_DEFINITIONS.slice(0, 5).map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center text-center p-3 bg-bg dark:bg-white/3 rounded-xl border border-border"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${badge.color}14` }}
                  >
                    <BadgeIcon iconPath={badge.iconPath} color={badge.color} size={16} />
                  </div>
                  <p className="text-xs font-semibold text-text leading-tight">{badge.name}</p>
                  <p className="text-xs text-text-muted/60 mt-0.5 leading-snug">{badge.description}</p>
                </div>
              ))}
            </div>
          </PreviewCard>
        </Section>

        {/* ══════════════ Report ══════════════ */}
        <Section id="report" label="รายงานสำหรับผู้ปกครอง">
          <PreviewCard>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-text">สรุปอัตโนมัติ</h3>
                <p className="text-sm text-text-muted mt-0.5">
                  รายงานที่อ่านง่าย พร้อมคำแนะนำจากผู้เชี่ยวชาญ
                </p>
              </div>
              <CtaButton href="/report" variant="outline">ดูรายงาน</CtaButton>
            </div>

            <div className="space-y-2">
              <div className="bg-bg dark:bg-white/3 border border-border rounded-xl p-3">
                <p className="text-sm font-semibold text-text">น้องกำลังอยู่ในระดับ Level 3</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-text">
                <span className="text-primary flex-shrink-0 mt-0.5 font-bold">·</span>
                ฝึกรวม 31 ครั้ง · คะแนนเฉลี่ย 73%
              </div>
              <div className="flex items-start gap-2 text-sm text-text">
                <span className="text-success flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                พัฒนาการจาก Pre-test ถึง Review: +33 คะแนน
              </div>
            </div>
          </PreviewCard>
        </Section>

        {/* ══════════════ AI-ready ══════════════ */}
        <Section id="ai" label="สถาปัตยกรรม AI-ready">
          <PreviewCard
            className="border-primary/15"
            style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.04) 0%, transparent 60%)" }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text mb-1">พร้อมเชื่อมต่อ AI จริง</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  ระบบออกแบบมาให้สลับจาก mock evaluation เป็น AI จริงได้ง่าย
                  ผ่าน evaluation provider interface —
                  เพียงเปลี่ยน provider ไม่ต้องแก้ logic การฝึก
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Provider Interface", "Mock API", "Real-time Audio", "Score Analysis"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-primary/6 text-primary text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </PreviewCard>
        </Section>

        {/* ══════════════ Demo Data CTA ══════════════ */}
        <Section id="try" label="ลองใช้งาน">
          <PreviewCard className="text-center space-y-4">
            <div>
              <h3 className="text-base font-bold text-text mb-1">ลองดูข้อมูลตัวอย่าง</h3>
              <p className="text-sm text-text-muted">
                โหลดข้อมูลสาธิต {DEMO_ATTEMPT_COUNT} ครั้ง ครอบคลุม 7 ระดับการฝึก
                เพื่อดูรายงานความก้าวหน้าแบบเต็มรูปแบบ
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={handleLoadDemo}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm shadow-primary/20"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                โหลดข้อมูลสาธิต
              </button>
              <CtaButton href="/training" variant="outline">เริ่มฝึกเลย</CtaButton>
              <CtaButton href="/library" variant="outline">ดูเนื้อหาทั้งหมด</CtaButton>
            </div>
          </PreviewCard>
        </Section>

        {/* ══════════════ Tech note ══════════════ */}
        <div className="text-center text-xs text-text-muted/60 pt-4 pb-8">
          <p>Speech Adventure — Prototype v0.1</p>
          <p className="mt-0.5">Built with Next.js, React, TypeScript, and Tailwind CSS</p>
        </div>
      </div>
    </AppShell>
  );
}
