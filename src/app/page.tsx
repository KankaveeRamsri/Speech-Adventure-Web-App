import HeroSection from "@/components/speech-adventure/HeroSection";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}

const journeySteps = [
  { step: 1, name: "Pre-test", desc: "ประเมินเสียงเริ่มต้น", color: "#A29BFE" },
  { step: 2, name: "Oral Motor", desc: "ฝึกกล้ามเนื้อช่องปาก", color: "#FD79A8" },
  { step: 3, name: "Sound Fam.", desc: "จดจำเสียงพยัญชนะ", color: "#00CEC9" },
  { step: 4, name: "Sound Prod.", desc: "ฝึกออกเสียง", color: "#FDCB6E" },
  { step: 5, name: "Word Practice", desc: "ฝึกออกเสียงคำ", color: "#E17055" },
  { step: 6, name: "Sentence", desc: "ฝึกออกเสียงประโยค", color: "#6C5CE7" },
  { step: 7, name: "Review", desc: "ทบทวนและประเมินผล", color: "#A29BFE" },
];

const features = [
  {
    icon: <RouteIcon />,
    title: "ฝึกตามระดับ",
    desc: "เส้นทางฝึกฝน 7 ระดับ ออกแบบโดยผู้เชี่ยวชาญด้านนักบำบัดการพูด",
    accent: "text-primary bg-primary/10",
  },
  {
    icon: <MicIcon />,
    title: "บันทึกเสียง",
    desc: "อัดเสียงของเด็กและฟังเปรียบเทียบกับเสียงต้นแบบได้ทันที",
    accent: "text-level-sound-fam bg-level-sound-fam/10",
  },
  {
    icon: <BrainIcon />,
    title: "AI ประเมินผล",
    desc: "ระบบ AI จะวิเคราะห์เสียงและให้ Feedback แบบ Real-time (เร็วๆ นี้)",
    accent: "text-level-sentence bg-level-sentence/10",
  },
  {
    icon: <ChartIcon />,
    title: "ติดตามผล",
    desc: "Dashboard สำหรับผู้ปกครองและครู ดูพัฒนาการได้อย่างชัดเจน",
    accent: "text-success bg-success/10",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            </div>
            <span className="font-bold text-base text-text">Speech Adventure</span>
          </div>

          <div className="flex items-center gap-1">
            <Link href="/training" className="text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-all">
              เริ่มฝึก
            </Link>
            <Link href="/progress" className="text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-all hidden sm:block">
              ความก้าวหน้า
            </Link>
            <Link href="/report" className="text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-all">
              รายงาน
            </Link>
            <div className="w-px h-5 bg-border mx-1" />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* ── Hero ── */}
        <div className="pt-8 pb-4">
          <HeroSection />
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: "ระดับการฝึก", value: "7" },
            { label: "เสียงพยัญชนะ", value: "4+" },
            { label: "ภารกิจต่อระดับ", value: "5-8" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface border border-border rounded-xl px-4 py-3.5 text-center">
              <p className="text-xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <section className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text mb-2">
              ทำไมต้อง Speech Adventure
            </h2>
            <p className="text-text-muted max-w-lg mx-auto">
              ออกแบบมาเพื่อเด็กไทย ตั้งแต่การฝึกพื้นฐานจนถึงการสื่อสารในชีวิตประจำวัน
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-surface border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.accent}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-text mb-1.5">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Journey Steps ── */}
        <section className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text mb-2">เส้นทางการฝึก</h2>
            <p className="text-text-muted max-w-lg mx-auto">
              7 ขั้นตอนที่ออกแบบอย่างเป็นระบบ เพื่อพัฒนาการพูดอย่างต่อเนื่อง
            </p>
          </div>

          {/* Desktop: horizontal */}
          <div className="hidden md:flex items-start gap-0">
            {journeySteps.map((step, i) => (
              <div key={step.name} className="flex-1 flex flex-col items-center relative">
                {/* Connector line */}
                {i < journeySteps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-px bg-border" />
                )}
                {/* Step circle */}
                <div
                  className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-3"
                  style={{ backgroundColor: step.color }}
                >
                  {step.step}
                </div>
                <p className="text-xs font-semibold text-text text-center leading-tight">{step.name}</p>
                <p className="text-xs text-text-muted text-center mt-0.5 leading-tight">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="md:hidden space-y-3">
            {journeySteps.map((step) => (
              <div key={step.name} className="flex items-center gap-4 bg-surface border border-border rounded-xl px-4 py-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: step.color }}
                >
                  {step.step}
                </div>
                <div>
                  <p className="font-semibold text-text text-sm">{step.name}</p>
                  <p className="text-xs text-text-muted">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Prototype Notice ── */}
        <section className="mt-12">
          <div className="bg-info/8 border border-info/20 rounded-xl px-5 py-4">
            <p className="text-sm text-info leading-relaxed">
              <strong>หมายเหตุ:</strong> Speech Adventure เวอร์ชันนี้เป็น Prototype
              ระบบ AI วิเคราะห์เสียงจริงจะเพิ่มเข้ามาในเฟสถัดไป
              ปัจจุบันใช้ Mock Evaluation เพื่อสาธิต UX Flow
            </p>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mt-16 bg-gradient-to-br from-primary/5 via-surface to-level-sentence/5 border border-primary/15 rounded-2xl px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-text mb-3">
            พร้อมเริ่มต้นการฝึกแล้วหรือยัง?
          </h2>
          <p className="text-text-muted mb-8 max-w-md mx-auto">
            เริ่มจาก Pre-test เพื่อประเมินระดับเสียงปัจจุบัน แล้วระบบจะแนะนำเส้นทางที่เหมาะสม
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/training"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/25"
            >
              เริ่มฝึกเลย
            </Link>
            <Link
              href="/progress"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              ดูรายงานความก้าวหน้า
            </Link>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-surface border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-text-muted">
            Speech Adventure — ระบบฝึกพูดสำหรับเด็กไทย
          </p>
          <p className="text-xs text-text-muted">Prototype v1.0 · 2026</p>
        </div>
      </footer>
    </main>
  );
}
