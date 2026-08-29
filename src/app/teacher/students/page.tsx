"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import NavIcon from "@/components/layout/NavIcon";
import { useTeacherStudentDirectory } from "@/hooks/useTeacherStudentDirectory";
import { pct, thaiRelative } from "@/lib/teacher/format";

export default function TeacherStudentsPage() {
  const { rows, classrooms, status } = useTeacherStudentDirectory();
  const [query, setQuery] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");

  const loading = status === "loading";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((e) => {
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.nickname?.toLowerCase().includes(q) ?? false);
      const matchesClassroom =
        !classroomFilter || e.classrooms.some((c) => c.id === classroomFilter);
      return matchesQuery && matchesClassroom;
    });
  }, [rows, query, classroomFilter]);

  return (
    <TeacherPageShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
            <NavIcon name="students" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">นักเรียนทั้งหมด</h1>
            <p className="text-sm text-text-muted mt-0.5">นักเรียนในห้องเรียนของคุณ</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อนักเรียน"
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={classroomFilter}
            onChange={(e) => setClassroomFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">ทุกห้องเรียน</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
            <p className="text-sm text-text-muted">
              ยังไม่มีนักเรียน เพิ่มนักเรียนได้จากหน้าห้องเรียน
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">ไม่พบนักเรียนที่ตรงกับการค้นหา</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((e) => {
              const label = e.nickname ? `${e.name} (${e.nickname})` : e.name;
              return (
                <li key={e.childId}>
                  <Link
                    href={`/teacher/students/${e.childId}`}
                    className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                        {e.avatarEmoji ?? label.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-text truncate">{label}</p>
                        <p className="text-[11px] text-text-muted truncate">
                          {e.classrooms.map((c) => c.name).join(", ") || "ไม่มีห้องเรียน"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {e.practice ? (
                        <>
                          <p className="text-sm font-semibold text-text">
                            {pct(e.practice.averageScore)}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {e.practice.attemptCount} ครั้ง · {thaiRelative(e.practice.lastPracticedAt)}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-text-muted italic">ยังไม่เริ่มฝึก</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </TeacherPageShell>
  );
}
