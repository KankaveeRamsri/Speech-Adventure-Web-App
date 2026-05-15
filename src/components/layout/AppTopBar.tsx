"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import { mockTrainingStages } from "@/data/speechAdventureMockData";

function MicLogoIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function StarFilledIcon() {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="#FFB347" stroke="#FFB347" strokeWidth="1"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function AppTopBar() {
  const { summary, isHydrated, selectedSoundId } = useSpeechProgress();
  const { profile } = useChildProfile();
  const pathname = usePathname();

  const childName = profile?.name ?? null;
  const stars = isHydrated ? summary.starsEarned : 0;

  const currentStageId = isHydrated ? summary.currentStageId : null;
  const currentStage = mockTrainingStages.find((s) => s.id === currentStageId);

  // Hide "ฝึกต่อ" CTA when already on the practice page
  const isPracticePage =
    typeof pathname === "string" &&
    pathname.startsWith("/training/") &&
    pathname !== "/training";

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-surface/95 backdrop-blur-md border-b border-border print:hidden">
      <div className="flex items-center h-full gap-2 pl-4 pr-3 lg:pl-[236px]">

        {/* Mobile: compact app logo (hidden on desktop — sidebar has branding) */}
        <Link
          href="/"
          className="flex items-center gap-2 lg:hidden flex-shrink-0"
          aria-label="หน้าแรก"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <MicLogoIcon />
          </div>
          <span className="text-sm font-bold text-text hidden xs:block">Speech Adventure</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Child name */}
        {childName && (
          <span className="text-sm font-medium text-text hidden md:block truncate max-w-[140px] flex-shrink-0">
            {childName}
          </span>
        )}

        {/* Target sound badge */}
        {isHydrated && selectedSoundId && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
            เสียง {selectedSoundId}
          </span>
        )}

        {/* Stars */}
        {isHydrated && stars > 0 && (
          <Link
            href="/rewards"
            className="flex items-center gap-1 text-sm font-bold text-secondary hover:text-secondary/80 transition-colors flex-shrink-0 hidden sm:flex"
            aria-label={`ดาวสะสม ${stars} ดาว`}
          >
            <StarFilledIcon />
            <span>{stars}</span>
          </Link>
        )}

        {/* Quick CTA: continue training */}
        {isHydrated && currentStage && !isPracticePage && (
          <Link
            href={`/training/${currentStage.slug}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all active:scale-[0.97] flex-shrink-0"
          >
            ฝึกต่อ
          </Link>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
