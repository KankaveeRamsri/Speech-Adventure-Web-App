"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 px-8 py-14 md:px-16 md:py-20 text-white">
      {/* Abstract decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -translate-y-1/2 right-1/3 w-20 h-20 rounded-full bg-white/8" />
        <div className="absolute bottom-8 right-12 w-8 h-8 rounded-full bg-white/15" />
      </div>

      <div className="relative z-10 max-w-xl">
        {/* Platform badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8 text-sm font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-gentle flex-shrink-0" />
          AI-Ready Speech Training Platform
        </div>

        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          ระบบฝึกพูดอัจฉริยะ
          <br />
          <span className="text-violet-200">สำหรับเด็กไทย</span>
        </h1>

        <p className="text-base md:text-lg text-white/80 mb-8 leading-relaxed">
          ฝึกการออกเสียงพยัญชนะไทยอย่างเป็นระบบ ตั้งแต่ Oral Motor จนถึง Sentence Practice
          พร้อมระบบติดตามพัฒนาการสำหรับผู้ปกครองและครู
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/training"
            className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-violet-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20"
          >
            เริ่มฝึก
          </Link>
          <Link
            href="/progress"
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-white/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            ดูความก้าวหน้า
          </Link>
        </div>
      </div>
    </section>
  );
}
