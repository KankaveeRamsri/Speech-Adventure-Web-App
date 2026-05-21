"use client";

import Link from "next/link";
import { useChildProfile } from "@/hooks/useChildProfile";

export default function HomeCTASection() {
  const { hasProfile, profile } = useChildProfile();
  const firstName = profile?.name?.split(" ")[0] ?? "";

  return (
    <section
      className="mt-24 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-surface to-level-sentence/5 border border-primary/15 px-8 py-14 text-center"
      aria-labelledby="cta-heading"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-dots)" className="text-primary" />
        </svg>
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Heading */}
        <h2 id="cta-heading" className="text-2xl md:text-3xl font-bold text-text mb-3">
          {hasProfile
            ? `สวัสดี${firstName ? `, ${firstName}` : ""}! พร้อมฝึกต่อแล้วหรือยัง?`
            : "พร้อมเริ่มต้นการฝึกแล้วหรือยัง?"}
        </h2>

        <p className="text-text-muted mb-8 leading-relaxed">
          {hasProfile
            ? "กลับมาฝึกได้เลย หรือดูรายงานความก้าวหน้าของวันนี้"
            : "เริ่มจากการตั้งค่าโปรไฟล์เด็ก เลือกเสียงที่ต้องการฝึก แล้วระบบจะแนะนำเส้นทางที่เหมาะสม"}
        </p>

        {/* CTA buttons */}
        {hasProfile ? (
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/training"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/25"
            >
              ฝึกต่อเลย →
            </Link>
            <Link
              href="/progress"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              ดูรายงานความก้าวหน้า
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/25"
            >
              เริ่มฝึกฟรี →
            </Link>
            <Link
              href="/training"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              ดูตัวอย่างระบบ
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-text-muted font-medium px-6 py-3.5 rounded-xl text-base hover:text-text hover:bg-border/50 transition-all"
            >
              ทดลองฝึกเสียง
            </Link>
          </div>
        )}

        {/* Sub note */}
        <p className="text-xs text-text-muted mt-6">
          ไม่ต้องสมัครสมาชิก · บันทึกข้อมูลในเครื่องของคุณ · ใช้งานฟรี
        </p>
      </div>
    </section>
  );
}
