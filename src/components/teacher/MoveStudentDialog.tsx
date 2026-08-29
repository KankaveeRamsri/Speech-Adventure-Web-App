"use client";

import { useState } from "react";
import TeacherModal from "@/components/teacher/TeacherModal";
import type { Classroom } from "@/types/school";

interface Props {
  studentName: string;
  fromClassroomName: string;
  targets: Classroom[];
  onMove: (toClassroomId: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Move a student to another active classroom in the same workspace.
 * Membership only — no profile or practice data changes. Cross-organization
 * moves are impossible (the repository rejects them and only same-org
 * classrooms are offered here).
 */
export default function MoveStudentDialog({
  studentName,
  fromClassroomName,
  targets,
  onMove,
  onClose,
}: Props) {
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMove() {
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onMove(target);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setBusy(false);
    }
  }

  return (
    <TeacherModal
      title="ย้ายห้อง"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={busy || !target}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "กำลังย้าย…" : "ย้ายห้อง"}
          </button>
        </>
      }
    >
      <p className="text-sm text-text mb-4">
        ย้าย <span className="font-semibold">{studentName}</span> จากห้อง{" "}
        <span className="font-semibold">{fromClassroomName}</span> ไปยัง
      </p>

      {targets.length === 0 ? (
        <p className="text-xs text-text-muted italic">
          ยังไม่มีห้องเรียนอื่นให้ย้าย สร้างห้องเรียนใหม่ก่อน
        </p>
      ) : (
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">— เลือกห้องเรียน —</option>
          {targets.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <p className="mt-4 text-[11px] text-text-muted leading-relaxed">
        เปลี่ยนเฉพาะห้องเรียนของนักเรียน ประวัติการฝึกและข้อมูลอื่นๆ จะยังคงอยู่ครบถ้วน
      </p>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </TeacherModal>
  );
}
