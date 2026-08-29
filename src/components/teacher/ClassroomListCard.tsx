"use client";

import Link from "next/link";
import type { Classroom } from "@/types/school";
import { classroomStatus, CLASSROOM_STATUS_LABELS } from "@/types/school";

interface Props {
  classroom: Classroom;
  studentCount: number;
  /** Shown for archived cards instead of the "open" link. */
  onUnarchive?: (classroomId: string) => void;
}

function UsersIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function ClassroomListCard({ classroom, studentCount, onUnarchive }: Props) {
  const status = classroomStatus(classroom);
  const meta = [
    classroom.gradeLevel ? `ชั้น ${classroom.gradeLevel}` : null,
    classroom.academicYear ? `ปี ${classroom.academicYear}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-text leading-tight truncate">{classroom.name}</h3>
        {meta && <p className="text-xs text-text-muted mt-0.5">{meta}</p>}
      </div>

      <div className="flex items-center gap-1.5 text-sm text-text-muted">
        <UsersIcon />
        <span>
          นักเรียน <span className="font-semibold text-text">{studentCount}</span> คน
        </span>
      </div>

      <p className="text-xs text-text-muted">
        สถานะ:{" "}
        <span className={status === "active" ? "text-success font-medium" : "text-text-muted font-medium"}>
          {CLASSROOM_STATUS_LABELS[status]}
        </span>
      </p>

      {status === "active" ? (
        <Link
          href={`/teacher/classrooms/${classroom.id}`}
          className="mt-1 text-center px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
        >
          ดูห้องเรียน
        </Link>
      ) : (
        <div className="mt-1 flex gap-2">
          <Link
            href={`/teacher/classrooms/${classroom.id}`}
            className="flex-1 text-center px-3 py-2 rounded-xl border border-border text-text-muted text-sm font-medium hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all"
          >
            ดู
          </Link>
          {onUnarchive && (
            <button
              type="button"
              onClick={() => onUnarchive(classroom.id)}
              className="flex-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
            >
              กู้คืน
            </button>
          )}
        </div>
      )}
    </div>
  );
}
