"use client";

import Link from "next/link";
import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import TeacherChildProgressCard from "@/components/teacher/TeacherChildProgressCard";
import NavIcon from "@/components/layout/NavIcon";
import { useTeacherChildren } from "@/hooks/useTeacherChildren";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/hooks/useAuth";

/**
 * Teacher V2 dashboard — foundation state (Phase 1).
 *
 * Classrooms are the primary organizational model going forward; this page
 * intentionally does not build classroom CRUD (that's Phase 2) or compute
 * any analytics (that's Phase 5). It shows real counts only, plus the
 * existing parent-invitation "shared with you" children — that older
 * feature still works and isn't hidden, just no longer the primary surface.
 */
export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { children: sharedChildren, isHydrated: sharedHydrated } = useTeacherChildren();
  const { selectChild } = useChildProfile();
  const { switchChildProgress } = useSpeechProgress();
  const { listClassroomsForTeacher } = useSchool();

  const myClassrooms = user ? listClassroomsForTeacher(user.id) : [];
  const hasClassrooms = myClassrooms.length > 0;
  const hasSharedChildren = sharedHydrated && sharedChildren.length > 0;
  const greetingName = user?.email?.split("@")[0] ?? "คุณครู";

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

        {!sharedHydrated ? (
          /* Skeleton while hydrating */
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-40 animate-pulse" aria-hidden="true" />
            ))}
          </div>
        ) : (
          <>
            {hasClassrooms ? (
              /* Real, safe-to-read summary — no manufactured stats */
              <section className="bg-surface border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  ห้องเรียนของฉัน
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-2xl font-bold text-text leading-none">
                    {myClassrooms.length} <span className="text-sm font-medium text-text-muted">ห้องเรียน</span>
                  </p>
                  <Link href="/teacher/classrooms" className="text-sm font-semibold text-primary hover:underline flex-shrink-0">
                    ดูห้องเรียนทั้งหมด →
                  </Link>
                </div>
              </section>
            ) : (
              /* Foundation empty state — starting point for Phase 2 */
              <section className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4 text-primary">
                  <NavIcon name="teacher" size={26} />
                </div>
                <h2 className="text-lg font-bold text-text mb-1.5">เริ่มต้นใช้งาน Speech Adventure</h2>
                <p className="text-sm text-text-muted max-w-sm mx-auto mb-6 leading-relaxed">
                  สร้างห้องเรียนแรกของคุณ
                  <br />
                  เพิ่มนักเรียนและติดตามพัฒนาการด้านการพูดได้ในที่เดียว
                </p>
                <Link
                  href="/teacher/classrooms"
                  className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-xl px-6 py-3 text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  สร้างห้องเรียน
                </Link>
              </section>
            )}

            {/* Shared-with-you children — existing parent-invitation grants (unchanged feature) */}
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
          </>
        )}
      </div>
    </TeacherPageShell>
  );
}
