"use client";

import { useMemo, useState } from "react";
import type { PracticeAttempt, SpeechProgress } from "@/types/speechAdventure";
import { thaiDateTime } from "@/lib/teacher/format";

interface Props {
  progress: SpeechProgress;
}

const STAGE_LABELS_TH: Record<string, string> = {
  pretest: "ประเมินเบื้องต้น",
  "level-1": "ระดับ 1",
  "level-2": "ระดับ 2",
  "level-3": "ระดับ 3",
  "level-4": "ระดับ 4",
  "level-5": "ระดับ 5",
  review: "ทบทวน",
};

const EVAL_LABELS_TH: Record<string, string> = {
  passed: "ผ่าน",
  almost: "เกือบผ่าน",
  retry: "ลองใหม่",
};

function AttemptCard({ a }: { a: PracticeAttempt }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!(a.feedback || a.transcript || a.recommendation || a.practiceTip);

  return (
    <li className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={`w-full text-left px-3 py-2.5 flex items-start justify-between gap-3 ${
          hasDetail ? "cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]" : "cursor-default"
        }`}
      >
        <div className="min-w-0">
          <p className="text-[11px] text-text-muted">{thaiDateTime(a.createdAt)}</p>
          <p className="text-sm text-text mt-0.5">
            <span className="font-semibold">เสียง /{a.targetSound || "—"}/</span>
            {a.promptText && <span className="text-text-muted"> · คำ: {a.promptText}</span>}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {STAGE_LABELS_TH[a.stageId] ?? a.stageId}
            {a.status && ` · ${EVAL_LABELS_TH[a.status] ?? a.status}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-text">
            {Number.isFinite(a.score) ? `${a.score}%` : "—"}
          </span>
          {hasDetail && (
            <span className="text-text-muted text-xs" aria-hidden="true">
              {open ? "▲" : "▼"}
            </span>
          )}
        </div>
      </button>

      {open && hasDetail && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-1.5 text-xs">
          {a.transcript && (
            <p className="text-text-muted">
              <span className="font-medium text-text">เสียงที่ระบบได้ยิน:</span> {a.transcript}
            </p>
          )}
          {a.feedback && (
            <p className="text-text-muted">
              <span className="font-medium text-text">ผลประเมิน:</span> {a.feedback}
            </p>
          )}
          {a.practiceTip && (
            <p className="text-text-muted">
              <span className="font-medium text-text">คำแนะนำการฝึก:</span> {a.practiceTip}
            </p>
          )}
          {a.recommendation && (
            <p className="text-text-muted">
              <span className="font-medium text-text">ข้อเสนอแนะ:</span> {a.recommendation}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function StudentHistoryTab({ progress }: Props) {
  const attempts = useMemo(
    () =>
      [...(progress.attempts ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [progress.attempts],
  );

  if (attempts.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
        <h2 className="text-base font-semibold text-text mb-1">ยังไม่มีประวัติการฝึก</h2>
        <p className="text-sm text-text-muted max-w-xs mx-auto">
          เมื่อนักเรียนเริ่มฝึก รายการฝึกทั้งหมดจะแสดงที่นี่
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-text-muted mb-3">{attempts.length} รายการ · เรียงจากล่าสุด</p>
      <ul className="space-y-2">
        {attempts.map((a) => (
          <AttemptCard key={a.id} a={a} />
        ))}
      </ul>
    </div>
  );
}
