"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import CloudSyncPreview from "@/components/sync/CloudSyncPreview";
import InviteSection from "@/components/layout/InviteSection";
import { useAuth } from "@/hooks/useAuth";

// ── Icons ─────────────────────────────────────────────────────────────────────

function UserCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 20a6 6 0 0 0-12 0" />
      <circle cx="12" cy="10" r="4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function LogInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-text">{title}</h2>
      {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-border/60 animate-pulse ${className}`} aria-hidden="true" />;
}

// ── Account section ───────────────────────────────────────────────────────────

function AccountSection() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl px-4 py-4 flex items-center gap-3">
        <SkeletonBlock className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-3.5 w-40" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="bg-surface border border-border rounded-xl divide-y divide-border">
        {/* Signed-in row */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
            <UserCircleIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text truncate">{user.email || "ผู้ใช้งาน"}</p>
            <p className="text-xs text-success mt-0.5">เข้าสู่ระบบแล้ว</p>
          </div>
        </div>
        {/* Sign-out row */}
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 text-sm font-medium text-error hover:text-error/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <LogOutIcon />
            {signingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
          </button>
        </div>
      </div>
    );
  }

  // Not signed in
  return (
    <div className="bg-surface border border-border rounded-xl divide-y divide-border">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-full bg-border/60 flex items-center justify-center flex-shrink-0 text-text-muted">
          <UserCircleIcon />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-muted">ยังไม่ได้เข้าสู่ระบบ</p>
          <p className="text-xs text-text-muted/70 mt-0.5">เข้าสู่ระบบเพื่อซิงค์ข้อมูลไปยัง Cloud</p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <LogInIcon />
          เข้าสู่ระบบ
        </Link>
        <span className="text-border">·</span>
        <Link
          href="/auth/signup"
          className="text-sm text-text-muted hover:text-text transition-colors"
        >
          สมัครสมาชิก
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-text">ตั้งค่า</h1>
          <p className="text-sm text-text-muted mt-1">จัดการบัญชีและการเชื่อมต่อ Cloud</p>
        </div>

        {/* Account section */}
        <section>
          <SectionHeader
            title="บัญชีผู้ใช้"
            description="สถานะการเข้าสู่ระบบสำหรับการซิงค์ข้อมูลกับ Supabase"
          />
          <AccountSection />
        </section>

        {/* Cloud sync section */}
        <section>
          <SectionHeader
            title="ซิงค์ข้อมูลไปยัง Cloud"
            description="แสดงตัวอย่างการย้ายข้อมูลจากอุปกรณ์นี้ไปยัง Supabase — ยังไม่มีการเปลี่ยนแปลงข้อมูลจริง"
          />
          <div className="bg-surface border border-border rounded-xl p-5">
            <CloudSyncPreview />
          </div>
        </section>

        {/* Invitations section */}
        <section>
          <SectionHeader
            title="คำเชิญ"
            description="เชิญผู้ปกครอง ครู หรือนักบำบัดเข้ามาดูพัฒนาการของเด็ก"
          />
          <div className="bg-surface border border-border rounded-xl p-5">
            <InviteSection />
          </div>
        </section>

        {/* App info section */}
        <section>
          <SectionHeader title="เกี่ยวกับแอป" />
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-muted">เวอร์ชัน</span>
              <span className="text-sm font-medium text-text">0.1.0 · Prototype</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-muted">ข้อมูลจัดเก็บที่</span>
              <span className="text-sm font-medium text-text">localStorage</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-muted">Storage Provider</span>
              <span className="text-sm font-mono text-text-muted bg-border/40 px-2 py-0.5 rounded">
                {process.env.NEXT_PUBLIC_STORAGE_PROVIDER ?? "local"}
              </span>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
