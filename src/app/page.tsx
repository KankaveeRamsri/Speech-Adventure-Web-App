import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";
import HeroSectionV2 from "@/components/home/HeroSectionV2";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TrainingJourneySection from "@/components/home/TrainingJourneySection";
import AIFeaturesSection from "@/components/home/AIFeaturesSection";
import ParentDashboardSection from "@/components/home/ParentDashboardSection";
import TrustSection from "@/components/home/TrustSection";
import HomeCTASection from "@/components/home/HomeCTASection";

export const metadata = {
  title: "Speech Adventure — ระบบฝึกพูดสำหรับเด็กไทย",
  description:
    "แพลตฟอร์มฝึกพูดพยัญชนะไทยสำหรับเด็ก ผ่าน 6 ระดับที่เป็นระบบ พร้อม AI ช่วยประเมิน และ Dashboard สำหรับผู้ปกครอง",
};

/** Thin nav bar — standalone (no AppShell) */
function LandingNav() {
  return (
    <nav
      className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-border"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between px-6 py-3.5 max-w-5xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
          <span className="font-bold text-base text-text">Speech Adventure</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/onboarding"
            className="text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-all hidden sm:block"
          >
            ตั้งค่า
          </Link>
          <Link
            href="/training"
            className="text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-all"
          >
            เริ่มฝึก
          </Link>
          <Link
            href="/progress"
            className="text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-all hidden sm:block"
          >
            ความก้าวหน้า
          </Link>
          <Link
            href="/report"
            className="text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-all hidden md:block"
          >
            รายงาน
          </Link>
          <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

/** Stats strip — quick numbers above the fold */
function StatsStrip() {
  const stats = [
    { label: "ระดับการฝึก", value: "6" },
    { label: "เสียงพยัญชนะ", value: "4+" },
    { label: "กิจกรรมต่อระดับ", value: "5–8" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mt-6" aria-label="สถิติแพลตฟอร์ม">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface border border-border rounded-xl px-4 py-3.5 text-center"
        >
          <p className="text-xl font-bold text-primary">{stat.value}</p>
          <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Landing page — standalone (no AppShell) */
export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <LandingNav />

      <div className="max-w-5xl mx-auto px-6 pb-24">
        {/* ── Hero ── */}
        <div className="pt-8 pb-4">
          <HeroSectionV2 />
        </div>

        {/* ── Stats strip ── */}
        <StatsStrip />

        {/* ── How It Works ── */}
        <HowItWorksSection />

        {/* ── Training Journey ── */}
        <TrainingJourneySection />

        {/* ── AI Features ── */}
        <AIFeaturesSection />

        {/* ── Parent Dashboard ── */}
        <ParentDashboardSection />

        {/* ── Trust & Thai Focus ── */}
        <TrustSection />

        {/* ── Final CTA ── */}
        <HomeCTASection />
      </div>

      {/* ── Footer ── */}
      <footer className="bg-surface border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                </svg>
              </div>
              <p className="text-sm text-text-muted font-medium">
                Speech Adventure — ระบบฝึกพูดสำหรับเด็กไทย
              </p>
            </div>

            {/* Footer links */}
            <div className="flex items-center gap-4">
              <Link href="/training" className="text-xs text-text-muted hover:text-text transition-colors">เริ่มฝึก</Link>
              <Link href="/progress" className="text-xs text-text-muted hover:text-text transition-colors">ความก้าวหน้า</Link>
              <Link href="/report" className="text-xs text-text-muted hover:text-text transition-colors">รายงาน</Link>
              <span className="text-xs text-text-muted">Prototype v1.0 · 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
