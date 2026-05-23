"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useInvitations } from "@/hooks/useInvitations";
import { useAuth } from "@/hooks/useAuth";
import type { Invitation } from "@/types/invitations";
import { INVITATION_ROLE_LABELS, INVITATION_STATUS_LABELS } from "@/types/invitations";

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-success">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-error">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  const { getByToken, acceptInvitation } = useInvitations();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null | undefined>(undefined);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the invitation from the token once the repo is hydrated.
  // All setState calls use setTimeout to avoid synchronous-in-effect lint rule.
  useEffect(() => {
    const id = setTimeout(() => {
      setInvitation(token ? getByToken(token) : null);
    }, 50);
    return () => clearTimeout(id);
  }, [token, getByToken]);

  async function handleAccept() {
    if (!invitation) return;
    setAccepting(true);
    setError(null);
    try {
      await acceptInvitation(token);
      setAccepted(true);
      setTimeout(() => router.push("/training"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setAccepting(false);
    }
  }

  // Loading states
  if (authLoading || invitation === undefined) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </main>
    );
  }

  // Success screen
  if (accepted) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircleIcon />
          <h1 className="text-xl font-bold text-text">ตอบรับคำเชิญสำเร็จ!</h1>
          <p className="text-text-muted text-sm">กำลังพาคุณไปยังหน้าฝึกพูด…</p>
        </div>
      </main>
    );
  }

  // Invalid token
  if (!invitation) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertIcon />
          <h1 className="text-xl font-bold text-text">ลิงก์คำเชิญไม่ถูกต้อง</h1>
          <p className="text-text-muted text-sm">
            ลิงก์นี้อาจหมดอายุ ถูกยกเลิก หรือไม่ถูกต้อง
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </main>
    );
  }

  const isExpiredOrRevoked = invitation.status === "expired" || invitation.status === "revoked";
  const isAlreadyAccepted = invitation.status === "accepted";
  const canAccept = invitation.status === "pending" && isAuthenticated;

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">

        {/* Icon + header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <MailIcon />
          </div>
          <h1 className="text-2xl font-bold text-text">คำเชิญเข้าร่วม</h1>
          <p className="text-text-muted text-sm">Speech Adventure</p>
        </div>

        {/* Invite details card */}
        <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm text-text-muted">บทบาท</span>
            <span className="font-semibold text-text">{INVITATION_ROLE_LABELS[invitation.role]}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm text-text-muted">อีเมลที่ได้รับคำเชิญ</span>
            <span className="font-semibold text-text truncate max-w-[200px]">{invitation.email}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm text-text-muted">สถานะ</span>
            <span className={`text-sm font-semibold ${
              invitation.status === "pending" ? "text-warning"
              : invitation.status === "accepted" ? "text-success"
              : "text-error"
            }`}>
              {INVITATION_STATUS_LABELS[invitation.status]}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm text-text-muted">หมดอายุ</span>
            <span className="text-sm font-medium text-text">
              {new Date(invitation.expiresAt).toLocaleDateString("th-TH", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Status messages */}
        {isExpiredOrRevoked && (
          <div className="bg-error/8 border border-error/20 rounded-xl px-4 py-3 text-sm text-error">
            คำเชิญนี้{invitation.status === "expired" ? "หมดอายุ" : "ถูกยกเลิก"}แล้ว กรุณาขอคำเชิญใหม่
          </div>
        )}

        {isAlreadyAccepted && (
          <div className="bg-success/8 border border-success/20 rounded-xl px-4 py-3 text-sm text-success">
            คำเชิญนี้ได้รับการตอบรับแล้ว
          </div>
        )}

        {error && (
          <div className="bg-error/8 border border-error/20 rounded-xl px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Auth required */}
        {invitation.status === "pending" && !isAuthenticated && (
          <div className="space-y-3">
            <div className="bg-info/8 border border-info/20 rounded-xl px-4 py-3 text-sm text-info">
              กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนตอบรับคำเชิญ
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/auth/signin?redirect=/invite/${token}`}
                className="flex items-center justify-center py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href={`/auth/signup?redirect=/invite/${token}`}
                className="flex items-center justify-center py-3 rounded-xl border border-border text-sm font-semibold text-text hover:border-primary/40 transition-all"
              >
                สมัครสมาชิก
              </Link>
            </div>
          </div>
        )}

        {/* Accept button */}
        {canAccept && (
          <div className="space-y-3">
            {user && (
              <p className="text-xs text-text-muted text-center">
                เข้าสู่ระบบในฐานะ <span className="font-semibold">{user.email}</span>
              </p>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-primary text-white text-sm font-bold py-4 rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-primary/25"
            >
              {accepting ? "กำลังตอบรับ…" : "ตอบรับคำเชิญ"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-xl border border-border text-sm text-text-muted hover:text-text transition-all"
            >
              ไม่ตอบรับ
            </button>
          </div>
        )}

        {/* Back link */}
        {(isExpiredOrRevoked || isAlreadyAccepted) && (
          <Link
            href="/"
            className="block text-center text-sm text-text-muted hover:text-text transition-colors"
          >
            กลับหน้าแรก
          </Link>
        )}

      </div>
    </main>
  );
}
