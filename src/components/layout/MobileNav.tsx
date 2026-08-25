"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon, { type NavIconName } from "./NavIcon";
import { useAuth, isSchoolAdmin } from "@/hooks/useAuth";
import { useTrustedAppRole } from "@/hooks/useTrustedAppRole";
import { FEATURES } from "@/lib/config/featureFlags";

type NavItem = { href: string; label: string; icon: NavIconName; exact?: boolean };

const PARENT_MOBILE: NavItem[] = [
  { href: "/dashboard", label: "หน้าหลัก", icon: "home", exact: true },
  { href: "/training", label: "ฝึก", icon: "training" },
  { href: "/library", label: "เนื้อหา", icon: "library" },
  { href: "/progress", label: "ก้าวหน้า", icon: "progress" },
  { href: "/rewards", label: "รางวัล", icon: "rewards" },
  { href: "/settings", label: "ตั้งค่า", icon: "settings" },
];

// Teacher V2 mobile nav — Settings lives in the UserMenu (mobile drawer),
// not in the bottom bar, matching the desktop nav.
const TEACHER_MOBILE: NavItem[] = [
  { href: "/teacher", label: "ภาพรวม", icon: "teacher", exact: true },
  { href: "/teacher/classrooms", label: "ห้องเรียน", icon: "classrooms" },
  { href: "/teacher/students", label: "นักเรียน", icon: "students" },
  { href: "/teacher/assignments", label: "แบบฝึก", icon: "assignments" },
  { href: "/teacher/reports", label: "รายงาน", icon: "report" },
];

const SCHOOL_MOBILE: NavItem[] = [
  { href: "/school", label: "โรงเรียน", icon: "school" },
  { href: "/report", label: "รายงาน", icon: "report" },
  { href: "/settings", label: "ตั้งค่า", icon: "settings" },
];

// Neutral placeholder shown only while an authenticated, non-school-admin
// user's trusted role is still resolving — never Parent or Teacher items,
// per Phase 1.1. Five slots to match the widest real nav (Teacher V2).
function NavBarSkeleton() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface/97 backdrop-blur-md border-t border-border lg:hidden print:hidden"
      aria-label="เมนูหลัก"
      aria-hidden="true"
    >
      <div className="flex h-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center justify-center flex-1 gap-1">
            <div className="w-5 h-5 rounded bg-border/50 animate-pulse" />
            <div className="h-2 w-8 rounded bg-border/40 animate-pulse" />
          </div>
        ))}
      </div>
    </nav>
  );
}

// Shown on a genuine trusted-role query failure — never Parent or Teacher
// items. retry() is the same function from useTrustedAppRole(), so this
// doesn't start a second query.
function NavBarError({ onRetry }: { onRetry: () => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface/97 backdrop-blur-md border-t border-border lg:hidden print:hidden flex items-center justify-center gap-2"
      aria-label="เมนูหลัก"
    >
      <span className="text-xs text-text-muted">ไม่สามารถโหลดเมนูได้</span>
      <button type="button" onClick={onRetry} className="text-xs font-semibold text-primary hover:underline">
        ลองใหม่
      </button>
    </nav>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { status: roleStatus, role: trustedRole, retry: retryRole } = useTrustedAppRole();
  const isTrustedTeacher = roleStatus === "ready" && trustedRole === "teacher";
  const isSchoolAdminActive = FEATURES.schoolAdmin && isSchoolAdmin(user);

  // Anonymous (local mode) has no trusted-role concept — Parent nav is
  // correct immediately. Otherwise: loading → neutral skeleton, error →
  // neutral error/retry (never Parent or Teacher chrome either way), ready
  // → the real Teacher/Parent nav below.
  const isAnonymous = !user;
  const roleLoading = !isAnonymous && !isSchoolAdminActive && (roleStatus === "idle" || roleStatus === "loading");
  const roleError = !isAnonymous && !isSchoolAdminActive && roleStatus === "error";

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : (pathname?.startsWith(item.href) ?? false);

  if (roleLoading) return <NavBarSkeleton />;
  if (roleError) return <NavBarError onRetry={retryRole} />;

  const items = isSchoolAdminActive
    ? SCHOOL_MOBILE
    : isTrustedTeacher
    ? TEACHER_MOBILE
    : PARENT_MOBILE;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface/97 backdrop-blur-md border-t border-border lg:hidden print:hidden"
      aria-label="เมนูหลัก"
    >
      <div className="flex h-full">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 text-xs font-medium transition-colors ${
                active ? "text-primary" : "text-text-muted hover:text-text"
              }`}
            >
              <NavIcon name={item.icon} active={active} size={20} />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
