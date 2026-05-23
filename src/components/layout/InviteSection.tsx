"use client";

import { useState, useCallback } from "react";
import { useInvitations } from "@/hooks/useInvitations";
import { useAuth } from "@/hooks/useAuth";
import type { InvitationRole, InvitationStatus } from "@/types/invitations";
import { INVITATION_ROLE_LABELS, INVITATION_STATUS_LABELS } from "@/types/invitations";

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<InvitationStatus, string> = {
  pending:  "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  expired:  "bg-border/60 text-text-muted border-border",
  revoked:  "bg-error/10 text-error border-error/20",
};

function StatusBadge({ status }: { status: InvitationStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CLASSES[status]}`}>
      {INVITATION_STATUS_LABELS[status]}
    </span>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS: InvitationRole[] = ["parent", "teacher", "therapist", "school_admin", "viewer"];

interface CreateFormProps {
  onClose: () => void;
}

function CreateInviteForm({ onClose }: CreateFormProps) {
  const { createInvitation } = useInvitations();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createInvitation({ email: email.trim(), role });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-primary/20 rounded-xl p-4">
      <div>
        <label className="block text-sm font-semibold text-text mb-1.5">อีเมล</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-text mb-1.5">บทบาท</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as InvitationRole)}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{INVITATION_ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "กำลังสร้าง…" : "ส่งคำเชิญ"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-sm text-text-muted hover:text-text transition-all"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InviteSection() {
  const { invitations, revokeInvitation } = useInvitations();
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyLink = useCallback((token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }, []);

  const handleRevoke = useCallback(
    async (id: string) => {
      await revokeInvitation(id);
    },
    [revokeInvitation],
  );

  const pending = invitations.filter((i) => i.status === "pending");
  const others = invitations.filter((i) => i.status !== "pending");

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text">คำเชิญ</h3>
          <p className="text-xs text-text-muted mt-0.5">
            เชิญผู้ปกครอง ครู หรือนักบำบัดเข้ามาดูพัฒนาการ
          </p>
        </div>
        {isAuthenticated && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all"
          >
            <PlusIcon />
            เชิญ
          </button>
        )}
      </div>

      {/* Require login hint */}
      {!isAuthenticated && (
        <p className="text-sm text-text-muted bg-surface border border-border rounded-xl px-4 py-3">
          กรุณา <span className="font-semibold text-primary">เข้าสู่ระบบ</span> ก่อนส่งคำเชิญ
        </p>
      )}

      {/* Create form */}
      {showForm && isAuthenticated && (
        <CreateInviteForm onClose={() => setShowForm(false)} />
      )}

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((inv) => (
            <div
              key={inv.id}
              className="bg-surface border border-border rounded-xl px-4 py-3 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text truncate">{inv.email}</span>
                  <span className="text-xs text-text-muted">{INVITATION_ROLE_LABELS[inv.role]}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  หมดอายุ {new Date(inv.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => copyLink(inv.token)}
                  title="คัดลอกลิงก์คำเชิญ"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text hover:border-primary/30 transition-all"
                >
                  <CopyIcon />
                  {copiedToken === inv.token ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                </button>
                <button
                  onClick={() => void handleRevoke(inv.id)}
                  title="ยกเลิกคำเชิญ"
                  className="p-1.5 rounded-lg border border-transparent text-text-muted hover:text-error hover:border-error/30 transition-all"
                >
                  <XIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past invitations (collapsed style) */}
      {others.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">ประวัติ</p>
          {others.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 bg-surface border border-border rounded-xl opacity-70"
            >
              <span className="text-sm text-text-muted truncate">{inv.email}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-text-muted">{INVITATION_ROLE_LABELS[inv.role]}</span>
                <StatusBadge status={inv.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {invitations.length === 0 && !showForm && isAuthenticated && (
        <p className="text-sm text-text-muted text-center py-4">
          ยังไม่มีคำเชิญ — กดปุ่ม &quot;เชิญ&quot; เพื่อเริ่มต้น
        </p>
      )}
    </div>
  );
}
