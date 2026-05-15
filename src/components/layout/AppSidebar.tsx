"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon, { type NavIconName } from "./NavIcon";

const NAV_ITEMS: { href: string; label: string; icon: NavIconName; exact?: boolean }[] = [
  { href: "/", label: "หน้าแรก", icon: "home", exact: true },
  { href: "/training", label: "ฝึกออกเสียง", icon: "training" },
  { href: "/progress", label: "ความก้าวหน้า", icon: "progress" },
  { href: "/rewards", label: "รางวัล", icon: "rewards" },
  { href: "/report", label: "รายงาน", icon: "report" },
  { href: "/onboarding", label: "โปรไฟล์", icon: "profile" },
];

function MicLogoIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV_ITEMS)[0]) =>
    item.exact
      ? pathname === item.href
      : (pathname?.startsWith(item.href) ?? false);

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 z-20 hidden lg:flex flex-col w-[220px] bg-surface border-r border-border print:hidden"
      aria-label="เมนูหลัก"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <MicLogoIcon />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text leading-tight">Speech</p>
          <p className="text-xs font-semibold text-primary leading-tight">Adventure</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
              <NavIcon name={item.icon} active={active} size={17} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex-shrink-0">
        <p className="text-xs text-text-muted">Demo Mode</p>
        <p className="text-xs text-text-muted/50">v0.1</p>
      </div>
    </aside>
  );
}
