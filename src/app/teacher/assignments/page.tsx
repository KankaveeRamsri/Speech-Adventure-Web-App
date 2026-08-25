"use client";

import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import ComingSoonPanel from "@/components/teacher/ComingSoonPanel";
import NavIcon from "@/components/layout/NavIcon";

export default function TeacherAssignmentsPage() {
  return (
    <TeacherPageShell>
      <ComingSoonPanel
        icon={<NavIcon name="assignments" size={26} />}
        title="แบบฝึก"
        description="มอบหมายแบบฝึกให้นักเรียนรายคน หลายคน หรือทั้งห้องเรียนได้เร็วๆ นี้"
      />
    </TeacherPageShell>
  );
}
