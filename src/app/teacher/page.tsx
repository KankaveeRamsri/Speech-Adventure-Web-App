"use client";

import Link from "next/link";
import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import TeacherChildProgressCard from "@/components/teacher/TeacherChildProgressCard";
import ClassroomListCard from "@/components/teacher/ClassroomListCard";
import NavIcon from "@/components/layout/NavIcon";
import { useTeacherChildren } from "@/hooks/useTeacherChildren";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useTeacherClassrooms } from "@/hooks/useTeacherClassrooms";
import { useAuth } from "@/hooks/useAuth";

/**
 * Teacher V2 dashboard.
 *
 * Classrooms are the primary organizational model. This page shows only real
 * counts derived from classroom data — no computed analytics (Phase 3+/5).
 * The older parent-invitation "shared with you" children still work and are
 * shown below, no longer the primary surface.
 */
export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { children: sharedChildren, isHydrated: sharedHydrated } = useTeacherChildren();
  const { selectChild } = useChildProfile();
  const { switchChildProgress } = useSpeechProgress();
  const { status, active, studentCount } = useTeacherClassrooms();

  const greetingName = user?.email?.split("@")[0] ?? "คุณครู";
  const hasSharedChildren = sharedHydrated && sharedChildren.length > 0;
  const classroomsReady = status === "ready";
  const totalStudents = active.reduce((sum, c) => sum + studentCount(c.id), 0);

  function handleSelectChild(childId: string) {
    selectChild(childId);
    switchChildProgress(childId);
  }

  return (
    <TeacherPageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
            <NavIcon name="teacher" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">สวัสดี คุณครู {greetingName}</h1>
            <p className="text-sm text-text-muted mt-0.5">ภาพรวมห้องเรียนและนักเรียนของคุณ</p>
          </div>
        </div>

        {/* Classroom summary */}
        {!classroomsReady ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl h-40 animate-pulse" aria-hidden="true" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <section className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4 text-primary">
              <NavIcon name="classrooms" size={26} />
            </div>
            <h2 className="text-lg font-bold text-text mb-1.5">สร้างห้องเรียนแรกของคุณ</h2>
            <p className="text-sm text-text-muted max-w-sm mx-auto mb-6 leading-relaxed">
              เพิ่มนักเรียนและติดตามพัฒนาการด้านการพูดได้ในที่เดียว
            </p>
            <Link
              href="/teacher/classrooms"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-xl px-6 py-3 text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              สร้างห้องเรียน
            </Link>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary leading-none">{active.length}</p>
                <p className="text-xs text-text-muted mt-1.5">ห้องเรียน</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-secondary leading-none">{totalStudents}</p>
                <p className="text-xs text-text-muted mt-1.5">นักเรียน</p>
              </div>
            </div>

            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  ห้องเรียนของฉัน
                </p>
                <Link href="/teacher/classrooms" className="text-sm font-semibold text-primary hover:underline">
                  ดูทั้งหมด →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {active.slice(0, 6).map((c) => (
                  <ClassroomListCard key={c.id} classroom={c} studentCount={studentCount(c.id)} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Shared-with-you children — existing parent-invitation grants (unchanged) */}
        {hasSharedChildren && (
          <section aria-label="เด็กที่ผู้ปกครองแชร์กับคุณ">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              เด็กที่ผู้ปกครองแชร์กับคุณ
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sharedChildren.map((data) => (
                <TeacherChildProgressCard key={data.grant.id} data={data} onSelect={handleSelectChild} />
              ))}
            </div>
          </section>
        )}
      </div>
    </TeacherPageShell>
  );
}
