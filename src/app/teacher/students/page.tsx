"use client";

import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import ComingSoonPanel from "@/components/teacher/ComingSoonPanel";
import NavIcon from "@/components/layout/NavIcon";

export default function TeacherStudentsPage() {
  return (
    <TeacherPageShell>
      <ComingSoonPanel
        icon={<NavIcon name="students" size={26} />}
        title="นักเรียน"
        description="ดูรายชื่อนักเรียนทั้งหมดและติดตามพัฒนาการรายบุคคลได้เร็วๆ นี้"
      />
    </TeacherPageShell>
  );
}
