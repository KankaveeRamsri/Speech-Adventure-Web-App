"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import CloudSyncPreview from "@/components/sync/CloudSyncPreview";
import {
  InviteNewMemberSection,
  SentInvitesSection,
  ChildAccessSection,
} from "@/components/layout/InviteSection";
import { useAuth } from "@/hooks/useAuth";
import { useChildAccess } from "@/hooks/useChildAccess";
import { useInvitations } from "@/hooks/useInvitations";
import { useCurrentChildAccess } from "@/hooks/useCurrentChildAccess";
import { ACCESS_ROLE_LABELS } from "@/types/childAccess";
import { INVITATION_ROLE_LABELS } from "@/types/invitations";

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

// ── Received invite lookup ─────────────────────────────────────────────────────

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ReceivedInviteSection() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const extractToken = useCallback((raw: string): string | null => {
    const trimmed = raw.trim();
    try {
      const url = new URL(trimmed);
      const t = url.searchParams.get("token");
      if (t) return t;
      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      return last && last !== "accept" ? last : null;
    } catch {
      if (/^[a-z0-9-]{8,}$/i.test(trimmed)) return trimmed;
    }
    return null;
  }, []);

  function handleOpen() {
    setError(null);
    const token = extractToken(input);
    if (!token) {
      setError("กรุณาวางลิงก์คำเชิญหรือ token ที่ถูกต้อง");
      return;
    }
    router.push(`/invite/accept?token=${token}`);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        วางลิงก์คำเชิญหรือ token ที่ได้รับเพื่อดูรายละเอียดและตอบรับ
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          placeholder="https://…/invite/accept?token=… หรือ token"
          className="flex-1 min-w-0 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
        />
        <button
          onClick={handleOpen}
          disabled={!input.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          <LinkIcon />
          เปิด
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

// ── Received invitations (pending invites addressed to me) ────────────────────

function PendingReceivedInvites() {
  const router = useRouter();
  const { receivedInvitations } = useInvitations();
  const pending = receivedInvitations.filter((i) => i.status === "pending");

  if (pending.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
        คำเชิญที่ส่งถึงฉัน
      </p>
      {pending.map((inv) => (
        <div
          key={inv.id}
          className="bg-surface border border-primary/20 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-text truncate">
              {inv.inviterEmail ?? "ผู้ส่งคำเชิญ"}
            </p>
            <p className="text-xs text-text-muted">
              {INVITATION_ROLE_LABELS[inv.role]} · หมดอายุ {new Date(inv.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => router.push(`/invite/accept?token=${inv.token}`)}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all flex-shrink-0"
          >
            ตอบรับ
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Received grants (child access shared to current user) ─────────────────────

function ReceivedGrantsSection() {
  const { receivedGrants } = useChildAccess();
  const active = receivedGrants.filter((g) => !g.revokedAt);

  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">สิทธิ์ที่ได้รับ</p>
      {active.map((grant) => (
        <div
          key={grant.id}
          className="bg-surface border border-border rounded-xl px-4 py-3 flex items-start justify-between gap-3"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-text truncate">
              {grant.childSnapshot?.name ?? grant.childId}
            </p>
            <p className="text-xs text-text-muted">
              {ACCESS_ROLE_LABELS[grant.role]}
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 flex-shrink-0">
            ใช้งานอยู่
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { isOwner, isSharedChild } = useCurrentChildAccess();

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

        {/* 1–3. Owner-only: invite, access management, sent invites */}
        {isOwner ? (
          <>
            {/* 1. Invite new member */}
            <section>
              <SectionHeader
                title="เชิญสมาชิกใหม่"
                description="เชิญผู้ปกครอง ครู หรือนักบำบัดเข้ามาดูพัฒนาการของเด็ก"
              />
              <div className="bg-surface border border-border rounded-xl p-5">
                <InviteNewMemberSection />
              </div>
            </section>

            {/* 2. Active child access — grouped by child */}
            <section>
              <SectionHeader
                title="สมาชิกที่เข้าถึงเด็กได้"
                description="จัดการสิทธิ์การเข้าถึงของสมาชิกแต่ละคนต่อเด็กแต่ละคน"
              />
              <div className="bg-surface border border-border rounded-xl p-5">
                <ChildAccessSection />
              </div>
            </section>

            {/* 3. Sent invitations history */}
            <section>
              <SectionHeader
                title="คำเชิญที่ส่งแล้ว"
                description="ประวัติคำเชิญและสถานะการตอบรับ"
              />
              <div className="bg-surface border border-border rounded-xl p-5">
                <SentInvitesSection />
              </div>
            </section>
          </>
        ) : isSharedChild ? (
          <section>
            <SectionHeader title="การจัดการสิทธิ์" />
            <div className="bg-surface border border-border rounded-xl px-4 py-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5BA4CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">คุณมีสิทธิ์ดูเท่านั้น</p>
                <p className="text-xs text-text-muted mt-0.5">การเชิญสมาชิกและจัดการสิทธิ์ทำได้เฉพาะเจ้าของโปรไฟล์เด็ก</p>
              </div>
            </div>
          </section>
        ) : null}

        {/* Received invitations / grants (for current user) */}
        <section>
          <SectionHeader
            title="คำเชิญที่ได้รับ"
            description="ตอบรับคำเชิญจากผู้ปกครอง ครู หรือนักบำบัดท่านอื่น"
          />
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <PendingReceivedInvites />
            <ReceivedInviteSection />
            <ReceivedGrantsSection />
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
