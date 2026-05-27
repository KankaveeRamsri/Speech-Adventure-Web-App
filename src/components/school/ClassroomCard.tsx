"use client";

import type { Classroom, ClassroomStudent, ClassroomTeacher } from "@/types/school";

interface Props {
  classroom: Classroom;
  students: ClassroomStudent[];
  teachers: ClassroomTeacher[];
}

function UsersIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function ClassroomCard({ classroom, students, teachers }: Props) {
  const meta: string[] = [];
  if (classroom.gradeLevel)   meta.push(`ชั้น ${classroom.gradeLevel}`);
  if (classroom.academicYear) meta.push(`ปี ${classroom.academicYear}`);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-text leading-tight">{classroom.name}</h3>
        {meta.length > 0 && (
          <p className="text-xs text-text-muted mt-0.5">{meta.join(" · ")}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <UsersIcon size={14} />
          <span>
            <span className="font-semibold text-text">{students.length}</span>
            {" "}นักเรียน
          </span>
        </div>
        <div className="text-sm text-text-muted">
          <span className="font-semibold text-text">{teachers.length}</span>
          {" "}ครู
        </div>
      </div>

      {/* Student badges — first 5 */}
      {students.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {students.slice(0, 5).map((s) => (
            <span
              key={s.childId}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {s.childId.slice(0, 6)}
            </span>
          ))}
          {students.length > 5 && (
            <span className="text-xs text-text-muted self-center">
              +{students.length - 5} เพิ่มเติม
            </span>
          )}
        </div>
      )}

      {students.length === 0 && (
        <p className="text-xs text-text-muted italic">ยังไม่มีนักเรียน</p>
      )}
    </div>
  );
}
