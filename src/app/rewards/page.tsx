"use client";

import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { calculateRewards } from "@/lib/rewards/calculateRewards";
import type { RewardBadge, EarnedReward, RewardProgress } from "@/types/rewards";

// ── Icons ──────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function BadgeIcon({ iconPath, color, size = 20 }: { iconPath: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPath.split("M").filter(Boolean).map((segment, i) => (
        <path key={i} d={`M${segment}`} />
      ))}
    </svg>
  );
}

// ── Badge Card ─────────────────────────────────────────────────────────────────

function EarnedBadgeCard({ reward }: { reward: EarnedReward }) {
  const { badge, earnedAt } = reward;
  const dateStr = (() => {
    try {
      return new Date(earnedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  })();

  return (
    <div className="flex flex-col items-center text-center p-4 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-fade-in">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${badge.color}18` }}
        aria-label={badge.name}
      >
        <BadgeIcon iconPath={badge.iconPath} color={badge.color} size={22} />
      </div>
      <h3 className="text-xs font-bold text-text leading-tight mb-0.5">{badge.name}</h3>
      <p className="text-xs text-text-muted leading-snug mb-2">{badge.description}</p>
      {dateStr && (
        <span
          className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ color: badge.color, backgroundColor: `${badge.color}14` }}
        >
          {dateStr}
        </span>
      )}
    </div>
  );
}

function LockedBadgeCard({ progress }: { progress: RewardProgress }) {
  const { badge, current, target, percentage, hint } = progress;

  return (
    <div className="flex flex-col items-center text-center p-4 bg-bg dark:bg-white/2 border border-border rounded-2xl">
      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-gray-100 dark:bg-white/6">
        <div className="opacity-25">
          <BadgeIcon iconPath={badge.iconPath} color={badge.color} size={22} />
        </div>
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-300 dark:bg-white/20 flex items-center justify-center text-gray-500 dark:text-white/40">
          <LockIcon />
        </span>
      </div>
      <h3 className="text-xs font-bold text-text-muted leading-tight mb-0.5">{badge.name}</h3>
      <p className="text-xs text-text-muted/70 leading-snug mb-2">{badge.description}</p>

      {/* Progress bar for countable badges */}
      {target > 1 && (
        <div className="w-full mb-1.5">
          <div className="h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${percentage}%`, backgroundColor: badge.color }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1">
            {current} / {target}
          </p>
        </div>
      )}

      <p className="text-xs text-text-muted/60 italic">{hint}</p>
    </div>
  );
}

// ── In-Progress Card (closer to earning) ──────────────────────────────────────

function InProgressCard({ progress }: { progress: RewardProgress }) {
  const { badge, current, target, percentage, hint } = progress;

  return (
    <div
      className="flex items-center gap-4 p-4 bg-surface border rounded-xl transition-all"
      style={{ borderColor: `${badge.color}30` }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${badge.color}14` }}
      >
        <div className="opacity-60">
          <BadgeIcon iconPath={badge.iconPath} color={badge.color} size={18} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-text">{badge.name}</p>
          {target > 1 && (
            <span className="text-xs font-medium text-text-muted">{current}/{target}</span>
          )}
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, backgroundColor: badge.color }}
          />
        </div>
        <p className="text-xs text-text-muted">{hint}</p>
      </div>
    </div>
  );
}

// ── Recent Achievement Banner ──────────────────────────────────────────────────

function RecentBadgeBanner({ reward }: { reward: EarnedReward }) {
  const { badge } = reward;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border animate-slide-up"
      style={{ backgroundColor: `${badge.color}0C`, borderColor: `${badge.color}30` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${badge.color}18` }}
      >
        <BadgeIcon iconPath={badge.iconPath} color={badge.color} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: badge.color }}>ปลดล็อกสำเร็จ</p>
        <p className="text-sm font-bold text-text">{badge.name}</p>
        <p className="text-xs text-text-muted truncate">{badge.description}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const { progress, summary, isHydrated } = useSpeechProgress();

  const result = isHydrated ? calculateRewards(progress) : null;
  const { earned = [], locked = [], recentAchievements = [], totalBadges = 10, earnedCount = 0 } = result ?? {};

  // Split locked into "in progress" (percentage > 0) and "not started"
  const inProgress = locked.filter((p) => p.percentage > 0).sort((a, b) => b.percentage - a.percentage);
  const notStarted = locked.filter((p) => p.percentage === 0);

  const totalStars = summary.starsEarned;
  const earnPercent = totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Hero stat bar ── */}
        <div
          className="rounded-2xl border border-border p-5"
          style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.06) 0%, rgba(255,179,71,0.04) 100%)" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">ดาวสะสมทั้งหมด</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-secondary leading-none">
                  {isHydrated ? totalStars : "—"}
                </span>
                <span className="text-base text-secondary font-semibold">ดาว</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">เหรียญตรา</p>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-4xl font-bold text-primary leading-none">
                  {isHydrated ? earnedCount : "—"}
                </span>
                <span className="text-base text-text-muted font-medium">/ {totalBadges}</span>
              </div>
            </div>
          </div>

          {/* Overall badge progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-text-muted">ความคืบหน้า</p>
              <p className="text-xs font-semibold text-primary">{isHydrated ? earnPercent : 0}%</p>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${isHydrated ? earnPercent : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── No data state ── */}
        {isHydrated && summary.totalAttempts === 0 && (
          <section className="bg-surface border border-border rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-text mb-1">ยังไม่มีเหรียญตรา</h2>
            <p className="text-sm text-text-muted mb-5">เริ่มฝึกเพื่อสะสมเหรียญตรา</p>
            <Link
              href="/training"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              เริ่มฝึกเลย
            </Link>
          </section>
        )}

        {/* ── Recent Achievements ── */}
        {isHydrated && recentAchievements.length > 0 && (
          <section aria-label="ความสำเร็จล่าสุด">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">ความสำเร็จล่าสุด (7 วัน)</p>
            <div className="space-y-2">
              {recentAchievements.map((r) => (
                <RecentBadgeBanner key={r.badge.id} reward={r} />
              ))}
            </div>
          </section>
        )}

        {/* ── Earned Badges ── */}
        {isHydrated && earned.length > 0 && (
          <section aria-label="เหรียญตราที่ได้รับ">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              เหรียญตราที่ได้รับ ({earned.length})
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {earned.map((r) => (
                <EarnedBadgeCard key={r.badge.id} reward={r} />
              ))}
            </div>
          </section>
        )}

        {/* ── In Progress ── */}
        {isHydrated && inProgress.length > 0 && (
          <section aria-label="กำลังดำเนินการ">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">ใกล้จะปลดล็อกแล้ว</p>
            <div className="space-y-2">
              {inProgress.map((p) => (
                <InProgressCard key={p.badge.id} progress={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Locked Badges ── */}
        {isHydrated && notStarted.length > 0 && (
          <section aria-label="เหรียญตราที่ยังล็อก">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              รอการปลดล็อก ({notStarted.length})
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {notStarted.map((p) => (
                <LockedBadgeCard key={p.badge.id} progress={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Skeleton while hydrating ── */}
        {!isHydrated && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-gray-100 dark:bg-white/6 animate-pulse" />
            ))}
          </section>
        )}

        {/* ── CTA Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/training"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-primary/20 text-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            ไปฝึกต่อ
          </Link>
          <Link
            href="/progress"
            className="flex-1 flex items-center justify-center gap-2 border border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary/8 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" x2="18" y1="20" y2="10" />
              <line x1="12" x2="12" y1="20" y2="4" />
              <line x1="6" x2="6" y1="20" y2="14" />
            </svg>
            ดูรายงาน
          </Link>
        </div>

        <div className="pb-4" />
      </div>
    </AppShell>
  );
}
