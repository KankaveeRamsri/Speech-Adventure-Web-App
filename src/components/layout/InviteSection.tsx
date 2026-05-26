"use client";

import { useState, useCallback, useMemo } from "react";
import { useInvitations } from "@/hooks/useInvitations";
import { useChildAccess } from "@/hooks/useChildAccess";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useAuth } from "@/hooks/useAuth";
import type { ChildAccess, ChildPermissions } from "@/types/childAccess";
import type { Invitation, InvitationRole, InvitationStatus } from "@/types/invitations";
import { INVITATION_ROLE_LABELS, INVITATION_STATUS_LABELS } from "@/types/invitations";
import { ACCESS_ROLE_LABELS } from "@/types/childAccess";

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

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
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

// ── Permission chips ──────────────────────────────────────────────────────────

const PERMISSION_LABELS: Record<keyof ChildPermissions, string> = {
  canViewProgress:   "ดูพัฒนาการ",
  canViewAudio:      "ฟังเสียง",
  canAssignPractice: "มอบหมายฝึก",
  canEditChild:      "แก้ไขโปรไฟล์",
  canExportReport:   "ส่งออกรายงาน",
};

interface PermissionChipsProps {
  permissions: ChildPermissions;
  editable: boolean;
  onToggle?: (key: keyof ChildPermissions, value: boolean) => void;
}

function PermissionChips({ permissions, editable, onToggle }: PermissionChipsProps) {
  const entries = Object.keys(PERMISSION_LABELS) as (keyof ChildPermissions)[];
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map((key) => {
        const on = permissions[key];
        const baseClass = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all";
        const stateClass = on
          ? "bg-success/10 text-success border-success/20"
          : "bg-border/40 text-text-muted border-border";
        const clickableClass = editable ? " hover:scale-[1.02] cursor-pointer" : "";
        return (
          <button
            key={key}
            type="button"
            disabled={!editable}
            onClick={() => editable && onToggle?.(key, !on)}
            className={`${baseClass} ${stateClass}${clickableClass} disabled:cursor-default`}
            aria-pressed={on}
          >
            <span className="flex-shrink-0">{on ? <CheckIcon /> : <DashIcon />}</span>
            {PERMISSION_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS: InvitationRole[] = ["parent", "teacher", "therapist", "school_admin", "viewer"];

interface CreateFormProps {
  onClose: () => void;
}

function CreateInviteForm({ onClose }: CreateFormProps) {
  const { createInvitation } = useInvitations();
  const { profiles } = useChildProfile();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("parent");
  const [childId, setChildId] = useState<string>(profiles[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createInvitation({ email: email.trim(), role, childId: childId || undefined });
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

      {profiles.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">เด็กที่แชร์</label>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          >
            <option value="">— ไม่ระบุ —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

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

// ── Section 1: Invite New Member ──────────────────────────────────────────────

export function InviteNewMemberSection() {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-text-muted bg-surface border border-border rounded-xl px-4 py-3">
        กรุณา <span className="font-semibold text-primary">เข้าสู่ระบบ</span> ก่อนเชิญสมาชิก
      </p>
    );
  }

  if (showForm) {
    return <CreateInviteForm onClose={() => setShowForm(false)} />;
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
    >
      <PlusIcon />
      เชิญสมาชิกใหม่
    </button>
  );
}

// ── Section 2: Sent Invitations (history + cancel pending) ────────────────────

export function SentInvitesSection() {
  const { sentInvitations, revokeInvitation } = useInvitations();
  const { isAuthenticated } = useAuth();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyLink = useCallback((token: string) => {
    const url = `${window.location.origin}/invite/accept?token=${token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }, []);

  const handleRevoke = useCallback(
    async (id: string) => {
      setRevoking(true);
      setError(null);
      try {
        await revokeInvitation(id);
        setConfirmRevokeId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ยกเลิกคำเชิญไม่สำเร็จ");
      } finally {
        setRevoking(false);
      }
    },
    [revokeInvitation],
  );

  const pending = sentInvitations.filter((i) => i.status === "pending");
  const others = sentInvitations.filter((i) => i.status !== "pending");

  if (!isAuthenticated) return null;

  if (sentInvitations.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-4">
        ยังไม่มีคำเชิญที่ส่ง — กดปุ่ม &quot;เชิญสมาชิกใหม่&quot; เพื่อเริ่มต้น
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start justify-between gap-3 bg-error/10 border border-error/30 text-error rounded-xl px-3 py-2 text-xs">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="font-semibold hover:underline flex-shrink-0">
            ปิด
          </button>
        </div>
      )}

      {/* Pending: still actionable (copy link / cancel) */}
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
                {confirmRevokeId === inv.id ? (
                  <>
                    <button
                      onClick={() => void handleRevoke(inv.id)}
                      disabled={revoking}
                      className="px-2.5 py-1.5 rounded-lg bg-error text-white text-xs font-semibold hover:bg-error/90 disabled:opacity-40 transition-all"
                    >
                      {revoking ? "…" : "ยืนยัน"}
                    </button>
                    <button
                      onClick={() => setConfirmRevokeId(null)}
                      className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text transition-all"
                    >
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => copyLink(inv.token)}
                      title="คัดลอกลิงก์คำเชิญ"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text hover:border-primary/30 transition-all"
                    >
                      <CopyIcon />
                      {copiedToken === inv.token ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                    </button>
                    <button
                      onClick={() => setConfirmRevokeId(inv.id)}
                      title="ยกเลิกคำเชิญ"
                      className="p-1.5 rounded-lg border border-transparent text-text-muted hover:text-error hover:border-error/30 transition-all"
                    >
                      <XIcon />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History: accepted / expired / revoked, read-only */}
      {others.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">ประวัติ</p>
          {others.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 bg-surface border border-border rounded-xl opacity-80"
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
    </div>
  );
}

// ── Section 3: Active Child Access (grouped by child) ─────────────────────────

interface MemberCardProps {
  grant: ChildAccess;
  email: string;
  onRevoke: () => Promise<void>;
  onUpdatePermission: (key: keyof ChildPermissions, value: boolean) => Promise<void>;
}

function MemberCard({ grant, email, onRevoke, onUpdatePermission }: MemberCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevokeClick() {
    setBusy(true);
    setError(null);
    try {
      await onRevoke();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ถอนสิทธิ์ไม่สำเร็จ");
    } finally {
      setBusy(false);
      setConfirmRevoke(false);
    }
  }

  async function handleToggle(key: keyof ChildPermissions, value: boolean) {
    setError(null);
    try {
      await onUpdatePermission(key, value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกสิทธิ์ไม่สำเร็จ");
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-text truncate">{email}</p>
          <p className="text-xs text-text-muted">{ACCESS_ROLE_LABELS[grant.role]}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {confirmRevoke ? (
            <>
              <button
                onClick={() => void handleRevokeClick()}
                disabled={busy}
                className="px-2.5 py-1.5 rounded-lg bg-error text-white text-xs font-semibold hover:bg-error/90 disabled:opacity-40 transition-all"
              >
                {busy ? "…" : "ยืนยัน"}
              </button>
              <button
                onClick={() => setConfirmRevoke(false)}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text transition-all"
              >
                ยกเลิก
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing((v) => !v)}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text hover:border-primary/30 transition-all"
              >
                {editing ? "เสร็จ" : "แก้สิทธิ์"}
              </button>
              <button
                onClick={() => setConfirmRevoke(true)}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-error hover:border-error/30 transition-all"
              >
                ถอนสิทธิ์
              </button>
            </>
          )}
        </div>
      </div>

      <PermissionChips permissions={grant.permissions} editable={editing} onToggle={handleToggle} />

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function ChildAccessSection() {
  const { profiles } = useChildProfile();
  const { issuedGrants, revokeChildAccess, updateChildPermissions } = useChildAccess();
  const { sentInvitations } = useInvitations();
  const { isAuthenticated } = useAuth();

  const active = useMemo(() => issuedGrants.filter((g) => !g.revokedAt), [issuedGrants]);

  // Group active grants by childId
  const grouped = useMemo(() => {
    const map = new Map<string, ChildAccess[]>();
    for (const g of active) {
      const list = map.get(g.childId);
      if (list) list.push(g);
      else map.set(g.childId, [g]);
    }
    return map;
  }, [active]);

  // Email lookup: invitation.acceptedBy === grant.userId AND childId matches.
  const memberEmail = useCallback(
    (grant: ChildAccess): string => {
      const inv = sentInvitations.find(
        (i: Invitation) =>
          i.acceptedBy === grant.userId &&
          i.childId === grant.childId &&
          i.status === "accepted",
      );
      return inv?.email ?? `${grant.userId.slice(0, 8)}…`;
    },
    [sentInvitations],
  );

  // Child name lookup: prefer owned profile, fall back to snapshot, else id prefix.
  const childName = useCallback(
    (childId: string): string => {
      const owned = profiles.find((p) => p.id === childId);
      if (owned) return owned.name;
      const snap = active.find((g) => g.childId === childId)?.childSnapshot;
      return snap?.name ?? `เด็ก ${childId.slice(0, 6)}`;
    },
    [profiles, active],
  );

  if (!isAuthenticated) return null;

  if (active.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-4">
        ยังไม่มีสมาชิกที่เข้าถึงเด็ก — เริ่มต้นด้วยการส่งคำเชิญ
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {[...grouped.entries()].map(([childId, grants]) => (
        <div key={childId} className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-sm font-bold text-text">{childName(childId)}</h4>
            <span className="text-xs text-text-muted">
              {grants.length} คน
            </span>
          </div>
          <div className="space-y-2">
            {grants.map((g) => (
              <MemberCard
                key={g.id}
                grant={g}
                email={memberEmail(g)}
                onRevoke={() => revokeChildAccess(g.id)}
                onUpdatePermission={(k, v) => updateChildPermissions(g.id, { [k]: v })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
