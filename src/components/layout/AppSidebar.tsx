"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon, { type NavIconName } from "./NavIcon";
import { useSidebar } from "./SidebarContext";
import ChildSelector from "./ChildSelector";
import UserMenu from "./UserMenu";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useAuth, isSchoolAdmin } from "@/hooks/useAuth";
import { useTrustedAppRole } from "@/hooks/useTrustedAppRole";
import { mockTrainingStages } from "@/data/speechAdventureMockData";
import { FEATURES } from "@/lib/config/featureFlags";

type NavItem = { href: string; label: string; icon: NavIconName; exact?: boolean };

const PARENT_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "หน้าหลัก", icon: "home", exact: true },
  { href: "/training", label: "ฝึกและเรียน", icon: "training" },
  { href: "/library", label: "เนื้อหา", icon: "library" },
  { href: "/progress", label: "ความก้าวหน้า", icon: "progress" },
  { href: "/rewards", label: "รางวัล", icon: "rewards" },
  { href: "/report", label: "รายงาน", icon: "report" },
  { href: "/demo", label: "Showcase", icon: "demo" },
  { href: "/onboarding?edit=true", label: "โปรไฟล์", icon: "profile" },
  { href: "/settings", label: "ตั้งค่า", icon: "settings" },
];

// Teacher V2 primary nav — Profile/Settings intentionally omitted; they live
// in the UserMenu (avatar) instead, per the Teacher V2 navigation spec.
const TEACHER_NAV_ITEMS: NavItem[] = [
  { href: "/teacher", label: "ภาพรวม", icon: "teacher", exact: true },
  { href: "/teacher/classrooms", label: "ห้องเรียน", icon: "classrooms" },
  { href: "/teacher/students", label: "นักเรียน", icon: "students" },
  { href: "/teacher/assignments", label: "แบบฝึก", icon: "assignments" },
  { href: "/teacher/reports", label: "รายงาน", icon: "report" },
];

const SCHOOL_ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/school", label: "จัดการโรงเรียน", icon: "school" },
  { href: "/report", label: "รายงาน", icon: "report" },
  { href: "/settings", label: "ตั้งค่า", icon: "settings" },
];

function MicLogoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function StarFilledIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFB347" stroke="#FFB347" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Neutral chrome shown only while an authenticated, non-school-admin user's
// trusted role is still resolving — never Teacher or Parent content, per
// Phase 1.1. Same shape (avatar circle + two lines) regardless of which
// role turns out to be correct, so there's no layout jump when it resolves.
function ContextSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`px-3 py-3 border-b border-border flex-shrink-0 ${collapsed ? "flex items-center justify-center" : ""}`} aria-hidden="true">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-border/50 animate-pulse flex-shrink-0" />
        {!collapsed && (
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3 w-24 rounded bg-border/50 animate-pulse" />
            <div className="h-2.5 w-16 rounded bg-border/40 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

function NavSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className="flex-1 px-3 py-3 space-y-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-5 h-5 rounded bg-border/50 animate-pulse flex-shrink-0" />
          {!collapsed && (
            <div className="h-3.5 rounded bg-border/50 animate-pulse" style={{ width: `${50 + i * 6}%` }} />
          )}
        </div>
      ))}
    </nav>
  );
}

function WarningIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// Shown when the trusted-role query genuinely fails (not while loading) —
// never falls back to Teacher or Parent chrome. retry() is the same
// function from useTrustedAppRole(), so this doesn't start a second query;
// it just re-invokes the one shared resolution the whole app reads from.
function ContextError({ collapsed, onRetry }: { collapsed: boolean; onRetry: () => void }) {
  if (collapsed) {
    return (
      <div className="px-3 py-3 border-b border-border flex-shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={onRetry}
          aria-label="ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้ — ลองใหม่"
          title="ลองใหม่"
          className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/15 transition-colors"
        >
          <WarningIcon size={15} />
        </button>
      </div>
    );
  }
  return (
    <div className="px-3 py-3 border-b border-border flex-shrink-0">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center flex-shrink-0">
          <WarningIcon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text leading-snug">ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้</p>
          <button type="button" onClick={onRetry} className="text-xs font-semibold text-primary hover:underline mt-0.5">
            ลองใหม่
          </button>
        </div>
      </div>
    </div>
  );
}

function NavError() {
  return (
    <div className="flex-1 px-3 py-3" aria-hidden="true">
      <p className="text-xs text-text-muted px-3 leading-snug">ไม่สามารถโหลดเมนูได้</p>
    </div>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mounted, mobileOpen, setMobileOpen } = useSidebar();
  const { summary, isHydrated, selectedSoundId } = useSpeechProgress();
  const { profile } = useChildProfile();
  const { user } = useAuth();
  const { status: roleStatus, role: trustedRole, retry: retryRole } = useTrustedAppRole();

  const isSpeechMode = !isHydrated || profile?.trainingMode !== "kindergarten_phonics";

  // School Admin nav only renders while the feature flag is on — an existing
  // school_admin account falls back to the parent nav when it's off, since
  // /school itself now redirects them away. School Admin isn't part of the
  // trusted-role scheme (public.user_app_roles only ever resolves to
  // "teacher" | "parent" — see src/lib/auth/trustedRole.ts), so this one
  // branch still reads user_metadata via isSchoolAdmin(), same as before.
  const isSchoolAdminActive = FEATURES.schoolAdmin && isSchoolAdmin(user);

  // Teacher nav requires the CONFIRMED trusted role, not user_metadata
  // (isTeacher(user)) — a spoofed/stale metadata role must never render
  // Teacher navigation for a non-teacher, and, just as importantly, a real
  // Teacher whose metadata is stale/missing must still see it.
  const isTrustedTeacher = roleStatus === "ready" && trustedRole === "teacher";

  // Anonymous (local mode) has no trusted-role concept at all — Parent
  // chrome is correct immediately. For an authenticated, non-school-admin
  // user, three distinct states apply: loading (neutral skeleton), ready
  // (real Teacher/Parent chrome), and error (neutral error/retry — never
  // Teacher or Parent chrome, never treated the same as "settled parent").
  const isAnonymous = !user;
  const roleLoading = !isAnonymous && !isSchoolAdminActive && (roleStatus === "idle" || roleStatus === "loading");
  const roleError = !isAnonymous && !isSchoolAdminActive && roleStatus === "error";

  const NAV_ITEMS: NavItem[] = isSchoolAdminActive
    ? SCHOOL_ADMIN_NAV_ITEMS
    : isTrustedTeacher
    ? TEACHER_NAV_ITEMS
    : PARENT_NAV_ITEMS;

  const isActive = (item: (typeof NAV_ITEMS)[0]) =>
    item.exact ? pathname === item.href : (pathname?.startsWith(item.href) ?? false);

  const stars = isHydrated ? summary.starsEarned : 0;
  const currentStageId = isHydrated ? summary.currentStageId : null;
  const currentStage = mockTrainingStages.find((s) => s.id === currentStageId);

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname, setMobileOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const expandedWidth = "240px";
  const collapsedWidth = "72px";
  const currentWidth = mounted ? (collapsed ? collapsedWidth : expandedWidth) : expandedWidth;
  const isCollapsed = collapsed && mounted;

  // Collapsible label helper
  const labelCls = isCollapsed
    ? "w-0 opacity-0 overflow-hidden"
    : "w-auto opacity-100";

  // ── Context section (role-aware) ──
  const isProfRole = isSchoolAdminActive || isTrustedTeacher;
  const contextSection = roleLoading ? (
    <ContextSkeleton collapsed={isCollapsed} />
  ) : roleError ? (
    <ContextError collapsed={isCollapsed} onRetry={retryRole} />
  ) : isProfRole ? (
    // Teacher / school_admin: avatar/profile menu instead of child context
    <div className="px-3 py-3 border-b border-border flex-shrink-0 space-y-2">
      {!isCollapsed && (
        <div className="flex items-center justify-end">
          <ThemeToggle />
        </div>
      )}
      <UserMenu collapsed={isCollapsed} />
    </div>
  ) : (
    // Parent / default: full child context
    <div className={`px-3 py-3 border-b border-border flex-shrink-0 ${isCollapsed ? "flex items-center justify-center" : "space-y-2.5"}`}>
      {isCollapsed ? (
        <ChildSelector collapsed />
      ) : (
        <>
          <ChildSelector />

          {/* Target sound + Stars row — speech_clarity only */}
          <div className="flex items-center gap-2 flex-wrap">
            {isHydrated && isSpeechMode && selectedSoundId && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                เสียง {selectedSoundId}
              </span>
            )}
            {isHydrated && isSpeechMode && stars > 0 && (
              <Link href="/rewards" className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors" aria-label={`ดาวสะสม ${stars} ดาว`}>
                <StarFilledIcon size={12} />
                <span>{stars}</span>
              </Link>
            )}
          </div>

          {/* Continue Training CTA — mode-aware */}
          {isHydrated && isSpeechMode && currentStage && (
            <Link
              href={`/training/${currentStage.slug}`}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all active:scale-[0.97]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              ฝึกต่อ
            </Link>
          )}
          {isHydrated && !isSpeechMode && (
            <Link
              href="/training"
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all active:scale-[0.97]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              เรียนต่อ
            </Link>
          )}

          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">ธีม</span>
            <ThemeToggle />
          </div>
        </>
      )}
    </div>
  );

  // ── Desktop sidebar content ──
  const desktopSidebar = (
    <>
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0">
        <Link href="/" className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors" aria-label="หน้าแรก">
          <MicLogoIcon size={16} />
        </Link>
        <div className={`min-w-0 overflow-hidden transition-all duration-200 ${labelCls}`}>
          <p className="text-sm font-bold text-text leading-tight whitespace-nowrap">Speech</p>
          <p className="text-xs font-semibold text-primary leading-tight whitespace-nowrap">Adventure</p>
        </div>
      </div>

      {/* Context (child info, actions) */}
      {contextSection}

      {/* Navigation */}
      {roleLoading ? (
        <NavSkeleton collapsed={isCollapsed} />
      ) : roleError ? (
        <NavError />
      ) : (
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:text-text hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <span className="flex-shrink-0 flex items-center justify-center w-5">
                  <NavIcon name={item.icon} active={active} size={17} />
                </span>
                <span className={`truncate whitespace-nowrap transition-all duration-200 ${labelCls}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Footer: Prototype badge */}
      <div className="px-3 py-3 border-t border-border flex-shrink-0">
        <div className={`rounded-xl bg-primary/6 border border-primary/12 px-3 py-2.5 transition-all duration-200 ${isCollapsed ? "flex items-center justify-center" : ""}`}>
          <div className={`flex items-center gap-2 ${isCollapsed ? "" : "mb-1"}`}>
            <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" aria-hidden="true" />
            <span className={`text-xs font-semibold text-primary whitespace-nowrap transition-all duration-200 ${isCollapsed ? "sr-only" : ""}`}>
              Prototype
            </span>
          </div>
          <p className={`text-xs text-text-muted/60 transition-all duration-200 ${isCollapsed ? "hidden" : ""}`}>
            v0.1 · Demo Mode
          </p>
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="px-3 pb-3 flex-shrink-0 hidden lg:block">
        <button
          onClick={toggle}
          aria-label={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
        >
          <span className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}>
            <ChevronLeftIcon />
          </span>
          <span className={`text-xs font-medium whitespace-nowrap transition-all duration-200 ${labelCls}`}>
            ย่อเมนู
          </span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed top-0 left-0 bottom-0 z-20 hidden lg:flex flex-col bg-surface border-r border-border print:hidden transition-[width] duration-200 ease-in-out"
        style={{ width: currentWidth }}
        aria-label="เมนูหลัก"
      >
        {desktopSidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:hidden print:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="เมนูหลัก"
        aria-hidden={!mobileOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-3" aria-label="หน้าแรก">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <MicLogoIcon size={16} />
            </div>
            <p className="text-sm font-bold text-text leading-tight">Speech Adventure</p>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="ปิดเมนู"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Mobile context */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0 space-y-2.5">
          {roleLoading ? (
            <ContextSkeleton collapsed={false} />
          ) : roleError ? (
            <ContextError collapsed={false} onRetry={retryRole} />
          ) : isProfRole ? (
            <>
              <div className="flex items-center justify-end">
                <ThemeToggle />
              </div>
              <UserMenu />
            </>
          ) : (
            <>
              <ChildSelector />
              <div className="flex items-center gap-2 flex-wrap">
                {isHydrated && isSpeechMode && selectedSoundId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    เสียง {selectedSoundId}
                  </span>
                )}
                {isHydrated && isSpeechMode && stars > 0 && (
                  <Link href="/rewards" className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors" aria-label={`ดาวสะสม ${stars} ดาว`}>
                    <StarFilledIcon size={12} />
                    <span>{stars}</span>
                  </Link>
                )}
              </div>
              {isHydrated && isSpeechMode && currentStage && (
                <Link
                  href={`/training/${currentStage.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all active:scale-[0.97]"
                >
                  ฝึกต่อ
                </Link>
              )}
              {isHydrated && !isSpeechMode && (
                <Link
                  href="/training"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all active:scale-[0.97]"
                >
                  เรียนต่อ
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile nav items */}
        {roleLoading ? (
          <NavSkeleton collapsed={false} />
        ) : roleError ? (
          <NavError />
        ) : (
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:text-text hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-5">
                    <NavIcon name={item.icon} active={active} size={17} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Mobile footer */}
        <div className="px-3 py-3 border-t border-border flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-text-muted">ธีม</span>
            <ThemeToggle />
          </div>
          <div className="rounded-xl bg-primary/6 border border-primary/12 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold text-primary">Prototype</span>
            </div>
            <p className="text-xs text-text-muted/60">v0.1 · Demo Mode</p>
          </div>
        </div>
      </aside>
    </>
  );
}
