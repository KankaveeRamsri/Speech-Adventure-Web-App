"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import NavIcon from "@/components/layout/NavIcon";
import ClassroomListCard from "@/components/teacher/ClassroomListCard";
import ClassroomFormDialog from "@/components/teacher/ClassroomFormDialog";
import { useTeacherClassrooms } from "@/hooks/useTeacherClassrooms";

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function TeacherClassroomsPage() {
  const router = useRouter();
  const { status, active, archived, studentCount, createClassroom, unarchiveClassroom } =
    useTeacherClassrooms();
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <TeacherPageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <NavIcon name="classrooms" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text">ห้องเรียน</h1>
              <p className="text-sm text-text-muted mt-0.5">สร้างและจัดการห้องเรียนของคุณ</p>
            </div>
          </div>
          {status === "ready" && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex-shrink-0"
            >
              <PlusIcon />
              สร้างห้องเรียน
            </button>
          )}
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl h-44 animate-pulse" aria-hidden="true" />
            ))}
          </div>
        )}

        {/* Error / retry */}
        {status === "error" && (
          <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
            <p className="text-sm text-text-muted mb-4">ไม่สามารถโหลดห้องเรียนได้ กรุณาลองใหม่</p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="bg-primary text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* Ready */}
        {status === "ready" && (
          <>
            {active.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4 text-primary">
                  <NavIcon name="classrooms" size={26} />
                </div>
                <h2 className="text-base font-semibold text-text mb-1">ยังไม่มีห้องเรียน</h2>
                <p className="text-sm text-text-muted max-w-xs mx-auto mb-5">
                  สร้างห้องเรียนแรกของคุณเพื่อเริ่มเพิ่มนักเรียนและติดตามพัฒนาการ
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold rounded-xl px-6 py-3 text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  <PlusIcon />
                  สร้างห้องเรียน
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {active.map((c) => (
                  <ClassroomListCard key={c.id} classroom={c} studentCount={studentCount(c.id)} />
                ))}
              </div>
            )}

            {/* Archived section */}
            {archived.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  className="text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-text transition-colors"
                >
                  ห้องเรียนที่เก็บไว้ ({archived.length}) {showArchived ? "▲" : "▼"}
                </button>
                {showArchived && (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mt-3">
                    {archived.map((c) => (
                      <ClassroomListCard
                        key={c.id}
                        classroom={c}
                        studentCount={studentCount(c.id)}
                        onUnarchive={unarchiveClassroom}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <ClassroomFormDialog
          mode="create"
          onSubmit={async (v) => {
            const room = await createClassroom({
              name: v.name,
              gradeLevel: v.gradeLevel || undefined,
              academicYear: v.academicYear || undefined,
            });
            router.push(`/teacher/classrooms/${room.id}`);
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </TeacherPageShell>
  );
}
