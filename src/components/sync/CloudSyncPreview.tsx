"use client";

import { useSyncPlanPreview } from "@/hooks/useSyncPlanPreview";
import type { StorageProvider } from "@/lib/config/storageProvider";
import type { SyncDomainPlan } from "@/lib/sync/syncPlan";

// ── SVG icons (no emoji) ──────────────────────────────────────────────────────

function DeviceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Provider label helpers ─────────────────────────────────────────────────────

function providerLabel(p: StorageProvider): string {
  if (p === "supabase") return "Supabase Cloud";
  if (p === "hybrid") return "Hybrid (Local + Cloud)";
  return "บน Device นี้";
}

function providerBadgeCls(p: StorageProvider): string {
  if (p === "supabase") return "bg-info/10 text-info border border-info/20";
  if (p === "hybrid") return "bg-primary/10 text-primary border border-primary/20";
  return "bg-success/10 text-success border border-success/20";
}

function domainLabel(d: SyncDomainPlan["domain"]): string {
  if (d === "profile") return "โปรไฟล์";
  if (d === "progress") return "ความก้าวหน้า";
  return "บันทึกการสังเกต";
}

function DomainIcon({ domain }: { domain: SyncDomainPlan["domain"] }) {
  if (domain === "profile") return <UserIcon />;
  if (domain === "progress") return <BarChartIcon />;
  return <ClipboardIcon />;
}

// ── Skeleton placeholder ──────────────────────────────────────────────────────

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-border/60 animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

// ── Domain count card ─────────────────────────────────────────────────────────

interface DomainCardProps {
  domain: SyncDomainPlan["domain"];
  recordCount: number;
  syncOrder: number;
  isHydrated: boolean;
}

function DomainCard({ domain, recordCount, syncOrder, isHydrated }: DomainCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted">
          <DomainIcon domain={domain} />
          <span className="text-sm font-semibold text-text">{domainLabel(domain)}</span>
        </div>
        <span className="text-xs font-medium text-text-muted/70 bg-border/50 px-2 py-0.5 rounded-full">
          ลำดับ {syncOrder}
        </span>
      </div>
      {isHydrated ? (
        <p className="text-2xl font-bold text-text">
          {recordCount}
          <span className="text-sm font-medium text-text-muted ml-1">รายการ</span>
        </p>
      ) : (
        <SkeletonBlock className="h-8 w-20" />
      )}
    </div>
  );
}

// ── Untracked domains (no local data or not in plan) ──────────────────────────

interface EmptyDomainCardProps {
  domain: SyncDomainPlan["domain"];
  isHydrated: boolean;
}

function EmptyDomainCard({ domain, isHydrated }: EmptyDomainCardProps) {
  return (
    <div className="bg-surface border border-border/50 rounded-xl p-4 flex flex-col gap-2 opacity-50">
      <div className="flex items-center gap-2 text-text-muted">
        <DomainIcon domain={domain} />
        <span className="text-sm font-semibold text-text-muted">{domainLabel(domain)}</span>
      </div>
      {isHydrated ? (
        <p className="text-sm text-text-muted">ไม่มีข้อมูล</p>
      ) : (
        <SkeletonBlock className="h-5 w-16" />
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CloudSyncPreview() {
  const { plan, provider, isSupabaseEnvSet, isHydrated, counts } = useSyncPlanPreview();

  const allDomains: SyncDomainPlan["domain"][] = ["profile", "progress", "observations"];

  const domainMap = new Map(plan.domains.map((d) => [d.domain, d]));

  // Determine why sync is blocked (for the UI — translated to Thai)
  function getBlockedMessage(): string | null {
    if (!isSupabaseEnvSet) {
      return "ยังไม่ได้ตั้งค่า Supabase — กรุณาเพิ่ม NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY";
    }
    if (provider === "local") {
      return "Storage Provider ปัจจุบันเป็น 'local' — เปลี่ยน NEXT_PUBLIC_STORAGE_PROVIDER=supabase เพื่อเปิดใช้งาน";
    }
    if (!plan.canSync && plan.blockedReason?.includes("signed in")) {
      return "กรุณาเข้าสู่ระบบก่อนซิงค์ข้อมูล";
    }
    if (!plan.canSync && plan.blockedReason?.includes("No local data")) {
      return "ไม่พบข้อมูลในอุปกรณ์นี้ที่ต้องการซิงค์";
    }
    return null;
  }

  const blockedMessage = getBlockedMessage();
  const hasAnyData = isHydrated && (counts.hasProfile || counts.attempts > 0 || counts.sessions > 0 || counts.observations > 0);

  return (
    <div className="space-y-5">

      {/* ── Status badges ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Active provider */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${providerBadgeCls(provider)}`}>
          {provider === "local" ? <DeviceIcon /> : <CloudIcon />}
          <span>{providerLabel(provider)}</span>
        </div>

        {/* Supabase env status */}
        {isSupabaseEnvSet ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
            <CheckCircleIcon />
            <span>Supabase พร้อมใช้งาน</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-error/8 text-error border border-error/20">
            <AlertTriangleIcon />
            <span>Supabase ยังไม่ได้ตั้งค่า</span>
          </div>
        )}
      </div>

      {/* ── Preview-only warning banner ── */}
      <div className="bg-secondary/8 border border-secondary/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <div className="mt-0.5 text-secondary flex-shrink-0">
          <AlertTriangleIcon />
        </div>
        <div>
          <p className="text-sm font-semibold text-text">โหมดแสดงตัวอย่างเท่านั้น</p>
          <p className="text-xs text-text-muted mt-0.5">
            ข้อมูลของคุณจะไม่ถูกย้ายหรือเปลี่ยนแปลงใดๆ ในขณะนี้ ฟีเจอร์ซิงค์จะเปิดใช้งานได้ในเวอร์ชันถัดไป
          </p>
        </div>
      </div>

      {/* ── Data summary heading ── */}
      <div>
        <h3 className="text-sm font-semibold text-text mb-3">
          ข้อมูลที่พบบนอุปกรณ์นี้
        </h3>
        {!isHydrated ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allDomains.map((d) => (
              <div key={d} className="bg-surface border border-border rounded-xl p-4">
                <SkeletonBlock className="h-5 w-24 mb-3" />
                <SkeletonBlock className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : !hasAnyData ? (
          <div className="bg-surface border border-border rounded-xl px-4 py-6 text-center">
            <p className="text-sm text-text-muted">ยังไม่มีข้อมูลในอุปกรณ์นี้</p>
            <p className="text-xs text-text-muted/60 mt-1">เริ่มฝึกออกเสียงเพื่อสร้างข้อมูลก่อนซิงค์</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allDomains.map((d) => {
              const inPlan = domainMap.get(d);
              if (inPlan) {
                return (
                  <DomainCard
                    key={d}
                    domain={inPlan.domain}
                    recordCount={inPlan.recordCount}
                    syncOrder={inPlan.syncOrder}
                    isHydrated={isHydrated}
                  />
                );
              }
              return <EmptyDomainCard key={d} domain={d} isHydrated={isHydrated} />;
            })}
          </div>
        )}
      </div>

      {/* ── Sync order ── */}
      {isHydrated && plan.domains.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text mb-2">ลำดับการซิงค์</h3>
          <div className="flex flex-wrap items-center gap-2">
            {plan.domains
              .slice()
              .sort((a, b) => a.syncOrder - b.syncOrder)
              .map((d, i, arr) => (
                <div key={d.domain} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-3 py-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {d.syncOrder}
                    </span>
                    <span className="text-xs font-medium text-text">{domainLabel(d.domain)}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-text-muted/40">
                      <ArrowRightIcon />
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Blocked reason ── */}
      {blockedMessage && (
        <div className="bg-info/8 border border-info/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="mt-0.5 text-info flex-shrink-0">
            <AlertTriangleIcon />
          </div>
          <p className="text-xs text-text-muted">{blockedMessage}</p>
        </div>
      )}

      {/* ── Action button (always disabled in Phase 28) ── */}
      <div className="space-y-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <LockIcon />
          อัปโหลดข้อมูลไปยัง Cloud
        </button>
        <p className="text-xs text-text-muted text-center">
          ฟีเจอร์นี้อยู่ระหว่างพัฒนา — ข้อมูลของคุณปลอดภัยบนอุปกรณ์นี้
        </p>
      </div>
    </div>
  );
}
