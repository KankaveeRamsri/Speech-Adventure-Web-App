"use client";

import { useEffect, useMemo, useState } from "react";
import TeacherPageShell from "@/components/teacher/TeacherPageShell";
import NavIcon from "@/components/layout/NavIcon";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { useTeacherClassrooms } from "@/hooks/useTeacherClassrooms";
import type { TeacherStudentDirectoryEntry } from "@/types/school";

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const { listTeacherStudentDirectory } = useSchool();
  const { active: classrooms, status } = useTeacherClassrooms();

  const [entries, setEntries] = useState<TeacherStudentDirectoryEntry[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");

  // Re-fetch whenever the set of classrooms the teacher owns changes.
  const classroomsKey = classrooms.map((c) => c.id).sort().join(",");
  const fetchKey = `${user?.id ?? ""}:${classroomsKey}`;
  const loading = status === "loading" || (status === "ready" && loadedKey !== fetchKey);

  useEffect(() => {
    if (!user || status !== "ready") return;
    let cancelled = false;
    listTeacherStudentDirectory(user.id)
      .then((rows) => {
        if (cancelled) return;
        setEntries(rows);
        setLoadedKey(fetchKey);
      })
      .catch(() => {
        if (!cancelled) setLoadedKey(fetchKey);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, status, fetchKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.nickname?.toLowerCase().includes(q) ?? false);
      const matchesClassroom =
        !classroomFilter || e.classrooms.some((c) => c.id === classroomFilter);
      return matchesQuery && matchesClassroom;
    });
  }, [entries, query, classroomFilter]);

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
              <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
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
                <li
                  key={e.childId}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface"
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
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-[11px] text-text-muted">
          รายละเอียดนักเรียนรายบุคคลจะเปิดให้ใช้งานในเฟสถัดไป
        </p>
      </div>
    </TeacherPageShell>
  );
}
