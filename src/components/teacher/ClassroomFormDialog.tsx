"use client";

import { useState } from "react";
import TeacherModal from "@/components/teacher/TeacherModal";
import type { Classroom } from "@/types/school";

interface Values {
  name: string;
  gradeLevel: string;
  academicYear: string;
}

interface Props {
  mode: "create" | "edit";
  /** Present in edit mode — pre-fills the form. */
  classroom?: Classroom;
  onSubmit: (values: Values) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

/**
 * Create or edit a classroom. Only `name` is required; grade level and
 * academic year are optional metadata that already exist in the schema.
 * No organization selection is ever shown (Teacher V2 constraint).
 */
export default function ClassroomFormDialog({ mode, classroom, onSubmit, onClose }: Props) {
  const [name, setName] = useState(classroom?.name ?? "");
  const [gradeLevel, setGradeLevel] = useState(classroom?.gradeLevel ?? "");
  const [academicYear, setAcademicYear] = useState(classroom?.academicYear ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !busy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        academicYear: academicYear.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setBusy(false);
    }
  }

  return (
    <TeacherModal
      title={mode === "create" ? "สร้างห้องเรียน" : "แก้ไขห้องเรียน"}
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
            type="submit"
            form="classroom-form"
            disabled={!canSubmit}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "กำลังบันทึก…" : mode === "create" ? "สร้างห้องเรียน" : "บันทึก"}
          </button>
        </>
      }
    >
      <form id="classroom-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cf-name" className="block text-xs font-semibold text-text-muted mb-1.5">
            ชื่อห้องเรียน <span className="text-error">*</span>
          </label>
          <input
            id="cf-name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="อนุบาล 2/1"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cf-grade" className="block text-xs font-semibold text-text-muted mb-1.5">
              ระดับชั้น
            </label>
            <input
              id="cf-grade"
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="อนุบาล 2"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cf-year" className="block text-xs font-semibold text-text-muted mb-1.5">
              ปีการศึกษา
            </label>
            <input
              id="cf-year"
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2569"
              className={inputClass}
            />
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}
      </form>
    </TeacherModal>
  );
}
