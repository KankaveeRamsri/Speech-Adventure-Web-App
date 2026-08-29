"use client";

import type { StudentAnalytics, SoundBreakdown } from "@/lib/teacher/studentAnalytics";
import { pct, thaiRelative } from "@/lib/teacher/format";

interface Props {
  analytics: StudentAnalytics;
}

function StatCard({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold leading-none ${accent ?? "text-text"}`}>{value}</p>
      <p className="text-xs text-text-muted mt-1.5">{label}</p>
    </div>
  );
}

function SoundRow({ s }: { s: SoundBreakdown }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.03]">
      <div className="min-w-0">
        <span className="text-sm font-semibold text-text">/{s.label}/</span>
        {s.description && <span className="text-xs text-text-muted ml-2">{s.description}</span>}
      </div>
      <div className="text-xs text-text-muted flex-shrink-0">
        {s.classification === "insufficient" ? (
          <span className="italic">ยังมีข้อมูลไม่เพียงพอ · {s.attemptCount} ครั้ง</span>
        ) : (
          <span>
            <span className="font-semibold text-text">{pct(s.averageScore)}</span> · {s.attemptCount} ครั้ง
          </span>
        )}
      </div>
    </div>
  );
}

export default function StudentOverviewTab({ analytics }: Props) {
  if (!analytics.hasData) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
        <h2 className="text-base font-semibold text-text mb-1">ยังไม่มีประวัติการฝึก</h2>
        <p className="text-sm text-text-muted max-w-xs mx-auto">
          เมื่อนักเรียนเริ่มฝึก ข้อมูลพัฒนาการจะแสดงที่นี่
        </p>
      </div>
    );
  }

  const good = analytics.soundBreakdown.filter((s) => s.classification === "good");
  const practiceMore = analytics.soundBreakdown.filter((s) => s.classification === "practice_more");
  const insufficient = analytics.soundBreakdown.filter((s) => s.classification === "insufficient");

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={String(analytics.wordsPracticed)} label="จำนวนคำที่ฝึก" accent="text-primary" />
        <StatCard value={String(analytics.practiceRounds)} label="รอบการฝึก" accent="text-secondary" />
        <StatCard value={pct(analytics.averageScore)} label="คะแนนเฉลี่ย" accent="text-info" />
        <StatCard value={thaiRelative(analytics.lastPracticedAt)} label="ฝึกล่าสุด" />
      </div>

      {analytics.currentStage && (
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted">ระดับปัจจุบัน</p>
            <p className="text-lg font-bold text-text mt-0.5">
              {analytics.currentStage.index} / {analytics.currentStage.total}
              <span className="text-sm font-medium text-text-muted ml-2">
                {analytics.currentStage.label}
              </span>
            </p>
          </div>
          {analytics.improvement != null && (
            <div className="text-right">
              <p className="text-xs text-text-muted">พัฒนาการ (ประเมิน → ทบทวน)</p>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  analytics.improvement > 0
                    ? "text-success"
                    : analytics.improvement < 0
                      ? "text-error"
                      : "text-text"
                }`}
              >
                {analytics.improvement > 0 ? "+" : ""}
                {analytics.improvement}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sound breakdown */}
      {good.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            เสียงที่ทำได้ดี
          </p>
          <div className="space-y-2">
            {good.map((s) => (
              <SoundRow key={s.soundId} s={s} />
            ))}
          </div>
        </section>
      )}

      {practiceMore.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            ควรฝึกเพิ่มเติม
          </p>
          <div className="space-y-2">
            {practiceMore.map((s) => (
              <SoundRow key={s.soundId} s={s} />
            ))}
          </div>
        </section>
      )}

      {insufficient.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            เสียงอื่นๆ ที่เริ่มฝึก
          </p>
          <div className="space-y-2">
            {insufficient.map((s) => (
              <SoundRow key={s.soundId} s={s} />
            ))}
          </div>
        </section>
      )}

      {/* Difficult words */}
      {analytics.difficultWords.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            คำที่ควรฝึกเพิ่มเติม
          </p>
          <div className="space-y-2">
            {analytics.difficultWords.map((w) => (
              <div
                key={w.practiceItemId}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.03]"
              >
                <span className="text-sm text-text truncate min-w-0">{w.promptText || "—"}</span>
                <span className="text-xs text-text-muted flex-shrink-0">
                  <span className="font-semibold text-text">{pct(w.averageScore)}</span> · {w.attempts} ครั้ง
                  {w.lowSample && <span className="italic ml-1">(ข้อมูลน้อย)</span>}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
