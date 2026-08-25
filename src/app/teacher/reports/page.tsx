"use client";

import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import ComingSoonPanel from "@/components/teacher/ComingSoonPanel";
import NavIcon from "@/components/layout/NavIcon";

export default function TeacherReportsPage() {
  return (
    <TeacherPageShell>
      <ComingSoonPanel
        icon={<NavIcon name="report" size={26} />}
        title="รายงาน"
        description="สร้างรายงานความก้าวหน้ารายบุคคลและรายห้องเรียนได้เร็วๆ นี้"
      />
    </TeacherPageShell>
  );
}
