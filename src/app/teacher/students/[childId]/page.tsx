"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import StudentDetailHeader from "@/components/teacher/StudentDetailHeader";
import StudentOverviewTab from "@/components/teacher/StudentOverviewTab";
import StudentProgressTab from "@/components/teacher/StudentProgressTab";
import StudentHistoryTab from "@/components/teacher/StudentHistoryTab";
import { useStudentDetail } from "@/hooks/useStudentDetail";

function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

type Tab = "overview" | "progress" | "history";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "ภาพรวม" },
  { id: "progress", label: "พัฒนาการ" },
  { id: "history", label: "ประวัติการฝึก" },
];

function isTab(v: string | null): v is Tab {
  return v === "overview" || v === "progress" || v === "history";
}

export default function TeacherStudentDetailPage() {
  const params = useParams<{ childId: string }>();
  const childId = params.childId;
  const { profile, progress, analytics, status, isPhonics } = useStudentDetail(childId);

  // URL-friendly tab state via history.replaceState — no navigation, no Suspense.
  // Lazy initializer reads the current ?tab= once, on first render.
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "overview";
    try {
      const t = new URLSearchParams(window.location.search).get("tab");
      return isTab(t) ? t : "overview";
    } catch {
      return "overview";
    }
  });
  function selectTab(next: Tab) {
    setTab(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* ignore */
    }
  }

  if (status === "loading") {
    return (
      <TeacherPageShell>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="h-6 w-32 bg-surface border border-border rounded-lg animate-pulse" />
          <div className="h-24 bg-surface border border-border rounded-2xl animate-pulse" />
          <div className="h-40 bg-surface border border-border rounded-2xl animate-pulse" />
        </div>
      </TeacherPageShell>
    );
  }

  if (status === "not-found" || !profile || !analytics || !progress) {
    return (
      <TeacherPageShell>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-lg font-bold text-text mb-1.5">ไม่พบนักเรียน</h1>
          <p className="text-sm text-text-muted mb-6">
            ไม่พบนักเรียน หรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้
          </p>
          <Link
            href="/teacher/students"
            className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-primary/90 transition-all"
          >
            กลับไปหน้านักเรียน
          </Link>
        </div>
      </TeacherPageShell>
    );
  }

  return (
    <TeacherPageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <Link
          href="/teacher/students"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <BackIcon />
          นักเรียนทั้งหมด
        </Link>

        <StudentDetailHeader profile={profile} />

        {isPhonics && (
          <div className="bg-info/8 border border-info/20 rounded-xl px-4 py-3 text-sm text-text">
            นักเรียนคนนี้อยู่ในโหมดโฟนิกส์อนุบาล — ข้อมูลพัฒนาการ Phonics สำหรับครูจะเพิ่มในเวอร์ชันถัดไป
            ด้านล่างแสดงเฉพาะข้อมูลการฝึกความชัดของเสียงพูด (ถ้ามี)
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
              }`}
              aria-current={tab === t.id ? "page" : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <StudentOverviewTab analytics={analytics} />}
        {tab === "progress" && <StudentProgressTab analytics={analytics} />}
        {tab === "history" && <StudentHistoryTab progress={progress} />}
      </div>
    </TeacherPageShell>
  );
}
