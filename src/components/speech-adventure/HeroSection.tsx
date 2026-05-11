"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-purple-400 px-6 py-12 md:px-12 md:py-16 text-white">
      <div className="absolute top-4 right-4 text-6xl md:text-8xl opacity-20 animate-float select-none" aria-hidden="true">
        🗣️
      </div>
      <div className="absolute bottom-4 left-4 text-5xl md:text-7xl opacity-15 animate-float select-none" style={{ animationDelay: "1s" }} aria-hidden="true">
        ⭐
      </div>

      <div className="relative z-10 max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          ผจญภัยฝึกการพูด
        </h1>
        <p className="text-lg md:text-xl opacity-90 mb-2 font-medium">
          Speech Adventure
        </p>
        <p className="text-base md:text-lg opacity-80 mb-8 leading-relaxed">
          แอปฝึกการออกเสียงสำหรับเด็ก สนุก เพลิดเพลิน
          พร้อมระบบประเมินผลจาก AI ที่จะช่วยให้การพูดของน้องๆ ชัดเจนยิ่งขึ้น
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/training"
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-2xl text-base md:text-lg hover:bg-opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            🚀 เริ่มฝึกเลย
          </Link>
          <Link
            href="/progress"
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-2xl text-base md:text-lg hover:bg-white/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            📊 ดูความก้าวหน้า
          </Link>
        </div>
      </div>
    </section>
  );
}
