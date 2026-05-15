"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon, { type NavIconName } from "./NavIcon";

const MOBILE_NAV: { href: string; label: string; icon: NavIconName; exact?: boolean }[] = [
  { href: "/", label: "หน้าแรก", icon: "home", exact: true },
  { href: "/training", label: "ฝึก", icon: "training" },
  { href: "/progress", label: "ก้าวหน้า", icon: "progress" },
  { href: "/rewards", label: "รางวัล", icon: "rewards" },
  { href: "/report", label: "รายงาน", icon: "report" },
];

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (item: (typeof MOBILE_NAV)[0]) =>
    item.exact
      ? pathname === item.href
      : (pathname?.startsWith(item.href) ?? false);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface/97 backdrop-blur-md border-t border-border lg:hidden print:hidden"
      aria-label="เมนูหลัก"
    >
      <div className="flex h-full">
        {MOBILE_NAV.map((item) => {
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
