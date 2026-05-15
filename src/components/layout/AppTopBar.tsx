"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import { mockTrainingStages } from "@/data/speechAdventureMockData";
import { useSidebar } from "./SidebarContext";

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

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {collapsed ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <polyline points="14 9 17 12 14 15" />
        </>
      )}
    </svg>
  );
}

export default function AppTopBar() {
  const { summary, isHydrated, selectedSoundId } = useSpeechProgress();
  const { profile } = useChildProfile();
  const pathname = usePathname();
  const { collapsed, toggle, mounted, setMobileOpen } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const childName = profile?.name ?? null;
  const stars = isHydrated ? summary.starsEarned : 0;

  const currentStageId = isHydrated ? summary.currentStageId : null;
  const currentStage = mockTrainingStages.find((s) => s.id === currentStageId);

  const isPracticePage =
    typeof pathname === "string" &&
    pathname.startsWith("/training/") &&
    pathname !== "/training";

  // Dynamic left padding: account for sidebar width on desktop
  const sidebarExpandedPad = "256px"; // 240px sidebar + 16px gap
  const sidebarCollapsedPad = "88px";  // 72px sidebar + 16px gap
  const desktopPad = mounted
    ? (collapsed ? sidebarCollapsedPad : sidebarExpandedPad)
    : sidebarExpandedPad;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-surface/95 backdrop-blur-md border-b border-border print:hidden">
      <div className="flex items-center h-full gap-2 pl-4 pr-3 transition-[padding-left] duration-200 ease-in-out" style={{ paddingLeft: isDesktop ? desktopPad : undefined }}>

        {/* Mobile: hamburger to open drawer */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-white/10 transition-all lg:hidden flex-shrink-0"
          aria-label="เปิดเมนู"
        >
          <HamburgerIcon />
        </button>

        {/* Mobile: compact app logo (hidden on desktop) */}
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
