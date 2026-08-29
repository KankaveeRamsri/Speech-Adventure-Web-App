"use client";

import { useMemo, useState } from "react";
import TeacherModal from "@/components/teacher/TeacherModal";
import { useTeacherChildren } from "@/hooks/useTeacherChildren";
import type { CreateClassroomStudentInput } from "@/types/school";

interface Props {
  classroomName: string;
  enrolledChildIds: Set<string>;
  onCreateStudent: (input: CreateClassroomStudentInput) => Promise<void>;
  onAddExisting: (childId: string) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

type Tab = "new" | "shared";

/**
 * Add a student to a classroom.
 *
 *  • "new"    — creates a teacher-managed student profile (owned by the
 *               teacher, stamped with the workspace org). NOT parent-linked.
 *  • "shared" — enrols a child a parent has already shared with this teacher
 *               through an active child_access grant (the only way a
 *               parent-owned child may be added — RLS enforces this too).
 */
export default function AddStudentDialog({
  classroomName,
  enrolledChildIds,
  onCreateStudent,
  onAddExisting,
  onClose,
}: Props) {
  const { children: sharedChildren, isHydrated } = useTeacherChildren();
  const [tab, setTab] = useState<Tab>("new");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New-student form
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const addableShared = useMemo(
    () => sharedChildren.filter((c) => !enrolledChildIds.has(c.child.id)),
    [sharedChildren, enrolledChildIds],
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const parsedAge = age.trim() ? Number(age) : undefined;
      await onCreateStudent({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        age: parsedAge && parsedAge >= 1 && parsedAge <= 18 ? parsedAge : undefined,
        gradeLevel: gradeLevel.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setBusy(false);
    }
  }

  async function handleAddExisting(childId: string) {
    setBusy(true);
    setError(null);
    try {
      await onAddExisting(childId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setBusy(false);
    }
  }

  return (
    <TeacherModal
      title={`เพิ่มนักเรียน · ${classroomName}`}
      onClose={onClose}
      busy={busy}
      footer={
        tab === "new" ? (
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
              type="submit"
              form="new-student-form"
              disabled={busy || !name.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? "กำลังเพิ่ม…" : "เพิ่มนักเรียน"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all disabled:opacity-50"
          >
            ปิด
          </button>
        )
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04]">
        <button
          type="button"
          onClick={() => { setTab("new"); setError(null); }}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab === "new" ? "bg-surface text-text shadow-sm" : "text-text-muted"
          }`}
        >
          สร้างนักเรียนใหม่
        </button>
        <button
          type="button"
          onClick={() => { setTab("shared"); setError(null); }}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab === "shared" ? "bg-surface text-text shadow-sm" : "text-text-muted"
          }`}
        >
          เด็กที่แชร์กับฉัน
        </button>
      </div>

      {tab === "new" ? (
        <form id="new-student-form" onSubmit={handleCreate} className="space-y-3">
          <div>
            <label htmlFor="ns-name" className="block text-xs font-semibold text-text-muted mb-1.5">
              ชื่อนักเรียน <span className="text-error">*</span>
            </label>
            <input id="ns-name" type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="เด็กหญิงมะลิ ใจดี" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ns-nick" className="block text-xs font-semibold text-text-muted mb-1.5">ชื่อเล่น</label>
              <input id="ns-nick" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="มะลิ" className={inputClass} />
            </div>
            <div>
              <label htmlFor="ns-age" className="block text-xs font-semibold text-text-muted mb-1.5">อายุ</label>
              <input id="ns-age" type="number" min={1} max={18} value={age} onChange={(e) => setAge(e.target.value)} placeholder="5" className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="ns-grade" className="block text-xs font-semibold text-text-muted mb-1.5">ระดับชั้น</label>
            <input id="ns-grade" type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="อนุบาล 2" className={inputClass} />
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            นักเรียนที่สร้างที่นี่เป็นนักเรียนในความดูแลของคุณครู ไม่ได้เชื่อมกับบัญชีผู้ปกครอง
          </p>
          {error && <p className="text-xs text-error">{error}</p>}
        </form>
      ) : (
        <div className="space-y-2">
          {!isHydrated ? (
            <p className="text-xs text-text-muted italic">กำลังโหลด…</p>
          ) : addableShared.length === 0 ? (
            <p className="text-xs text-text-muted italic">
              ยังไม่มีเด็กที่ผู้ปกครองแชร์กับคุณ หรือเพิ่มเข้าห้องนี้แล้วทั้งหมด
            </p>
          ) : (
            addableShared.map((c) => (
              <div
                key={c.child.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.03]"
              >
                <span className="text-sm text-text truncate min-w-0">{c.child.name}</span>
                <button
                  type="button"
                  onClick={() => handleAddExisting(c.child.id)}
                  disabled={busy}
                  className="flex-shrink-0 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  เพิ่ม
                </button>
              </div>
            ))
          )}
          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      )}
    </TeacherModal>
  );
}
