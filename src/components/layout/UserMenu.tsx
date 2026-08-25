"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTrustedAppRole } from "@/hooks/useTrustedAppRole";
import { ROLE_LABELS, resolveDisplayRole } from "@/lib/auth/roleLabels";

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Avatar / profile menu — houses Settings and Logout so primary navigation
 * (e.g. Teacher V2's 5-item nav) doesn't need its own entries for either.
 * Currently used by professional-role sidebar contexts (teacher, and
 * school_admin when that feature is enabled).
 */
export default function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { user, signOut } = useAuth();
  const { status: roleStatus, role: trustedRole } = useTrustedAppRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  const initial = user.email.charAt(0).toUpperCase() || "?";
  const displayRole = resolveDisplayRole(user.role, roleStatus, trustedRole);
  const roleLabel = displayRole ? (ROLE_LABELS[displayRole] ?? displayRole) : null;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/auth/signin");
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2.5 w-full rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
          collapsed ? "justify-center py-1.5" : "px-2 py-1.5"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-primary/12 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
          {initial}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-text truncate">{user.email}</p>
              {roleLabel ? (
                <p className="text-[11px] text-text-muted truncate">{roleLabel}</p>
              ) : roleStatus === "error" ? (
                // Genuine query failure — never a fabricated Parent/Teacher
                // label. In practice AppSidebar no longer mounts UserMenu at
                // all during an error (it shows its own ContextError
                // instead), so this is a defensive fallback for any other
                // caller.
                <p className="text-[11px] text-error truncate">ไม่สามารถตรวจสอบสิทธิ์ได้</p>
              ) : (
                <div className="h-2.5 w-14 rounded bg-border/50 animate-pulse mt-0.5" aria-hidden="true" />
              )}
            </div>
            <span className={`text-text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}>
              <ChevronDownIcon />
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full mt-2 min-w-[180px] bg-surface border border-border rounded-xl shadow-lg py-1.5 z-50"
        >
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2 text-sm text-text hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            ตั้งค่า
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="block w-full text-left px-3.5 py-2 text-sm text-error hover:bg-error/8 transition-colors disabled:opacity-50"
          >
            {signingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
          </button>
        </div>
      )}
    </div>
  );
}
