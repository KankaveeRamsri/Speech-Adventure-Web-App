"use client";

import Link from "next/link";
import { useChildProfile } from "@/hooks/useChildProfile";

export default function LandingCTA() {
  const { profile, hasProfile } = useChildProfile();

  const firstName = profile?.name.split(" ")[0] ?? "";

  if (!hasProfile) {
    return (
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/25"
        >
          ตั้งค่าเริ่มต้น →
        </Link>
        <Link
          href="/training"
          className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/5 transition-all active:scale-[0.98]"
        >
          ดูแผนที่การฝึก
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <Link
        href="/training"
        className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/25"
      >
        ฝึกต่อเลย{firstName ? `, ${firstName}` : ""} →
      </Link>
      <Link
        href="/progress"
        className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/5 transition-all active:scale-[0.98]"
      >
        ดูรายงานความก้าวหน้า
      </Link>
    </div>
  );
}
