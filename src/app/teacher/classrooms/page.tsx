"use client";

import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import ComingSoonPanel from "@/components/teacher/ComingSoonPanel";
import NavIcon from "@/components/layout/NavIcon";

export default function TeacherClassroomsPage() {
  return (
    <TeacherPageShell>
      <ComingSoonPanel
        icon={<NavIcon name="classrooms" size={26} />}
        title="ห้องเรียน"
        description="สร้างห้องเรียน เพิ่มนักเรียน และจัดการห้องเรียนของคุณได้เร็วๆ นี้"
      />
    </TeacherPageShell>
  );
}
