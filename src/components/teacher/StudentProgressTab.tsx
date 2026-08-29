"use client";

import type { StudentAnalytics } from "@/lib/teacher/studentAnalytics";
import ScoreTrendChart from "@/components/teacher/ScoreTrendChart";
import { pct, signedPct } from "@/lib/teacher/format";

interface Props {
  analytics: StudentAnalytics;
}

export default function StudentProgressTab({ analytics }: Props) {
  if (!analytics.hasData) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
        <h2 className="text-base font-semibold text-text mb-1">ยังไม่มีประวัติการฝึก</h2>
        <p className="text-sm text-text-muted max-w-xs mx-auto">
          เมื่อนักเรียนเริ่มฝึก แนวโน้มพัฒนาการจะแสดงที่นี่
        </p>
      </div>
    );
  }

  const { trend, firstVsLatest } = analytics;
  const withDelta = firstVsLatest.filter((d) => d.change != null);
  const withoutDelta = firstVsLatest.filter((d) => d.change == null);

  return (
    <div className="space-y-6">
      {/* Trend */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          แนวโน้มคะแนน
        </p>
        {trend.points.length < 2 ? (
          <p className="text-sm text-text-muted text-center py-6">
            ยังมีข้อมูลไม่เพียงพอที่จะแสดงแนวโน้ม (ฝึกเพียง {trend.points.length} ครั้ง)
          </p>
        ) : (
          <ScoreTrendChart points={trend.points} mode={trend.mode} />
        )}
      </section>

      {/* First vs latest */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          เปรียบเทียบ ครั้งแรก กับ ล่าสุด
        </p>

        {firstVsLatest.length === 0 ? (
          <p className="text-sm text-text-muted py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-2">
            {withDelta.map((d) => (
              <div
                key={d.soundId}
                className="rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-text">/{d.label}/</span>
                  <span
                    className={`text-sm font-bold ${
                      (d.change ?? 0) > 0
                        ? "text-success"
                        : (d.change ?? 0) < 0
                          ? "text-error"
                          : "text-text-muted"
                    }`}
                  >
                    {signedPct(d.change)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-text-muted">
                  <span>ครั้งแรก {pct(d.first)}</span>
                  <span>→</span>
                  <span>ล่าสุด {pct(d.latest)}</span>
                  <span className="ml-auto">{d.attemptCount} ครั้ง</span>
                </div>
              </div>
            ))}

            {withoutDelta.map((d) => (
              <div
                key={d.soundId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.03] px-3 py-2.5"
              >
                <span className="text-sm font-semibold text-text">/{d.label}/</span>
                <span className="text-xs text-text-muted italic">ยังมีข้อมูลไม่เพียงพอ</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
