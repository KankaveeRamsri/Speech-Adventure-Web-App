"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon, { type NavIconName } from "./NavIcon";
import { useSidebar } from "./SidebarContext";

const NAV_ITEMS: { href: string; label: string; icon: NavIconName; exact?: boolean }[] = [
  { href: "/", label: "หน้าแรก", icon: "home", exact: true },
  { href: "/training", label: "ฝึกออกเสียง", icon: "training" },
  { href: "/progress", label: "ความก้าวหน้า", icon: "progress" },
  { href: "/rewards", label: "รางวัล", icon: "rewards" },
  { href: "/report", label: "รายงาน", icon: "report" },
  { href: "/onboarding", label: "โปรไฟล์", icon: "profile" },
];

function MicLogoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mounted, mobileOpen, setMobileOpen } = useSidebar();

  const isActive = (item: (typeof NAV_ITEMS)[0]) =>
    item.exact
      ? pathname === item.href
      : (pathname?.startsWith(item.href) ?? false);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Use stable widths before hydration to avoid mismatch
  const expandedWidth = "240px";
  const collapsedWidth = "72px";
  const currentWidth = mounted ? (collapsed ? collapsedWidth : expandedWidth) : expandedWidth;

  const sidebarContent = (
    <>
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <MicLogoIcon size={16} />
        </div>
        <div
          className={`min-w-0 overflow-hidden transition-all duration-200 ${
            collapsed && mounted ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          <p className="text-sm font-bold text-text leading-tight whitespace-nowrap">Speech</p>
          <p className="text-xs font-semibold text-primary leading-tight whitespace-nowrap">Adventure</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed && mounted ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <span className="flex-shrink-0 flex items-center justify-center w-5">
                <NavIcon name={item.icon} active={active} size={17} />
              </span>
              <span
                className={`truncate whitespace-nowrap transition-all duration-200 ${
                  collapsed && mounted ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: Premium prototype badge */}
      <div className="px-3 py-3 border-t border-border flex-shrink-0">
        <div
          className={`rounded-xl bg-primary/6 border border-primary/12 px-3 py-2.5 transition-all duration-200 ${
            collapsed && mounted ? "flex items-center justify-center" : ""
          }`}
        >
          <div className={`flex items-center gap-2 ${collapsed && mounted ? "" : "mb-1.5"}`}>
            <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" aria-hidden="true" />
            <span
              className={`text-xs font-semibold text-primary whitespace-nowrap transition-all duration-200 ${
                collapsed && mounted ? "sr-only" : ""
              }`}
            >
              Prototype
            </span>
          </div>
          <p
            className={`text-xs text-text-muted/60 transition-all duration-200 ${
              collapsed && mounted ? "hidden" : ""
            }`}
          >
            v0.1 · Demo Mode
          </p>
        </div>
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="px-3 pb-3 flex-shrink-0 hidden lg:block">
        <button
          onClick={toggle}
          aria-label={collapsed && mounted ? "ขยายเมนู" : "ย่อเมนู"}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
        >
          <span className={`transition-transform duration-200 ${collapsed && mounted ? "rotate-180" : ""}`}>
            <ChevronIcon direction="left" />
          </span>
          <span
            className={`text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              collapsed && mounted ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
            }`}
          >
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
        {sidebarContent}
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
        {/* Close button */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <MicLogoIcon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-text leading-tight">Speech Adventure</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="ปิดเมนู"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile nav items */}
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
                <span className="flex-shrink-0 flex items-center justify-center w-5">
                  <NavIcon name={item.icon} active={active} size={17} />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile footer */}
        <div className="px-3 py-3 border-t border-border flex-shrink-0">
          <div className="rounded-xl bg-primary/6 border border-primary/12 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
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
