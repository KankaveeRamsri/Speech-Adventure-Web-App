"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import ConfirmDialog from "@/components/teacher/ConfirmDialog";
import ClassroomFormDialog from "@/components/teacher/ClassroomFormDialog";
import AddStudentDialog from "@/components/teacher/AddStudentDialog";
import MoveStudentDialog from "@/components/teacher/MoveStudentDialog";
import { useClassroom } from "@/hooks/useClassroom";
import { useTeacherClassrooms } from "@/hooks/useTeacherClassrooms";
import { classroomStatus, CLASSROOM_STATUS_LABELS } from "@/types/school";
import type { ClassroomStudentDetail } from "@/types/school";

function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function formatThaiDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function RosterRow({
  student,
  onMove,
  onRemove,
}: {
  student: ClassroomStudentDetail;
  onMove: () => void;
  onRemove: () => void;
}) {
  const label = student.nickname ? `${student.name} (${student.nickname})` : student.name;
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.03]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
          {student.avatarEmoji ?? label.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-text truncate">{label}</p>
          <p className="text-[11px] text-text-muted">เพิ่มเมื่อ {formatThaiDate(student.addedAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onMove}
          className="text-xs text-text-muted hover:text-text px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all"
        >
          ย้ายห้อง
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-error/80 hover:text-error px-2 py-1 rounded-lg hover:bg-error/5 transition-all"
        >
          นำออกจากห้อง
        </button>
      </div>
    </li>
  );
}

export default function TeacherClassroomDetailPage() {
  const params = useParams<{ classroomId: string }>();
  const classroomId = params.classroomId;
  const router = useRouter();

  const {
    classroom,
    status,
    studentCount,
    roster,
    rosterLoading,
    rosterError,
    reloadRoster,
    moveTargets,
    createStudent,
    addExistingChild,
    removeStudent,
    moveStudent,
  } = useClassroom(classroomId);
  const { renameClassroom, archiveClassroom } = useTeacherClassrooms();

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ClassroomStudentDetail | null>(null);
  const [moveTarget, setMoveTarget] = useState<ClassroomStudentDetail | null>(null);

  const enrolledIds = useMemo(() => new Set(roster.map((r) => r.childId)), [roster]);

  // ── Not found / loading guards ───────────────────────────────────────────
  if (status === "loading") {
    return (
      <TeacherPageShell>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div className="h-8 w-40 bg-surface border border-border rounded-xl animate-pulse mb-6" />
          <div className="h-44 bg-surface border border-border rounded-2xl animate-pulse" />
        </div>
      </TeacherPageShell>
    );
  }

  if (status === "not-found" || !classroom) {
    return (
      <TeacherPageShell>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-lg font-bold text-text mb-1.5">ไม่พบห้องเรียน</h1>
          <p className="text-sm text-text-muted mb-6">
            ห้องเรียนนี้ไม่มีอยู่ หรือคุณไม่มีสิทธิ์เข้าถึง
          </p>
          <Link
            href="/teacher/classrooms"
            className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-primary/90 transition-all"
          >
            กลับไปหน้าห้องเรียน
          </Link>
        </div>
      </TeacherPageShell>
    );
  }

  const cStatus = classroomStatus(classroom);
  const meta = [
    classroom.gradeLevel ? `ชั้น ${classroom.gradeLevel}` : null,
    classroom.academicYear ? `ปี ${classroom.academicYear}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TeacherPageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Link
          href="/teacher/classrooms"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <BackIcon />
          ห้องเรียนทั้งหมด
        </Link>

        {/* Header */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-text">{classroom.name}</h1>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  cStatus === "active"
                    ? "bg-success/10 text-success"
                    : "bg-border/50 text-text-muted"
                }`}
              >
                {CLASSROOM_STATUS_LABELS[cStatus]}
              </span>
            </div>
            {meta && <p className="text-sm text-text-muted mt-0.5">{meta}</p>}
            <p className="text-sm text-text-muted mt-1">
              นักเรียน <span className="font-semibold text-text">{studentCount}</span> คน
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              เพิ่มนักเรียน
            </button>
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all"
            >
              แก้ไขห้องเรียน
            </button>
            {cStatus === "active" && (
              <button
                type="button"
                onClick={() => setShowArchive(true)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all"
              >
                เก็บห้องเรียน
              </button>
            )}
          </div>
        </div>

        {/* Roster */}
        <section>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            รายชื่อนักเรียน
          </p>

          {rosterLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
              ))}
            </div>
          ) : rosterError ? (
            <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
              <p className="text-sm text-text-muted mb-3">โหลดรายชื่อนักเรียนไม่สำเร็จ</p>
              <button
                type="button"
                onClick={reloadRoster}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                ลองใหม่
              </button>
            </div>
          ) : roster.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
              <p className="text-sm text-text-muted mb-3">ยังไม่มีนักเรียนในห้องนี้</p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                เพิ่มนักเรียน
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {roster.map((s) => (
                <RosterRow
                  key={s.childId}
                  student={s}
                  onMove={() => setMoveTarget(s)}
                  onRemove={() => setRemoveTarget(s)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      {showAdd && (
        <AddStudentDialog
          classroomName={classroom.name}
          enrolledChildIds={enrolledIds}
          onCreateStudent={async (input) => {
            await createStudent(input);
            reloadRoster();
          }}
          onAddExisting={async (childId) => {
            await addExistingChild(childId);
            reloadRoster();
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showEdit && (
        <ClassroomFormDialog
          mode="edit"
          classroom={classroom}
          onSubmit={async (v) => {
            await renameClassroom(classroom.id, {
              name: v.name,
              gradeLevel: v.gradeLevel || null,
              academicYear: v.academicYear || null,
            });
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showArchive && (
        <ConfirmDialog
          title="เก็บห้องเรียน"
          body={
            <>
              เก็บห้องเรียน <span className="font-semibold">{classroom.name}</span>?
              <br />
              ห้องเรียนจะถูกซ่อนจากรายการที่ใช้งานอยู่ แต่รายชื่อนักเรียนและประวัติการฝึกทั้งหมดจะยังคงอยู่
              และกู้คืนได้ภายหลัง
            </>
          }
          confirmLabel="เก็บห้องเรียน"
          onConfirm={async () => {
            await archiveClassroom(classroom.id);
            router.push("/teacher/classrooms");
          }}
          onClose={() => setShowArchive(false)}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="นำนักเรียนออกจากห้อง"
          danger
          body={
            <>
              นำ <span className="font-semibold">{removeTarget.name}</span> ออกจากห้อง{" "}
              <span className="font-semibold">{classroom.name}</span>?
              <br />
              <span className="text-text-muted">
                เปลี่ยนเฉพาะการเป็นสมาชิกห้องเรียน ประวัติการฝึก โปรไฟล์เด็ก และข้อมูลอื่นๆ จะยังคงอยู่ครบถ้วน
              </span>
            </>
          }
          confirmLabel="นำออกจากห้อง"
          onConfirm={async () => {
            await removeStudent(removeTarget.childId);
            reloadRoster();
          }}
          onClose={() => setRemoveTarget(null)}
        />
      )}

      {moveTarget && (
        <MoveStudentDialog
          studentName={moveTarget.name}
          fromClassroomName={classroom.name}
          targets={moveTargets}
          onMove={async (toId) => {
            await moveStudent(moveTarget.childId, toId);
            reloadRoster();
          }}
          onClose={() => setMoveTarget(null)}
        />
      )}
    </TeacherPageShell>
  );
}
