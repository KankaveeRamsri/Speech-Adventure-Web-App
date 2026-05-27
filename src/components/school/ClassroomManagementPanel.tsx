"use client";

import { useEffect, useState } from "react";
import type { Classroom, UserDisplayInfo } from "@/types/school";
import { useSchool } from "@/hooks/useSchool";
import { useChildProfile } from "@/hooks/useChildProfile";

interface Props {
  classroom: Classroom;
  onClose: () => void;
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function ClassroomManagementPanel({ classroom, onClose }: Props) {
  const {
    listChildrenForClassroom,
    listTeachersForClassroom,
    assignTeacher,
    removeTeacher,
    addChild,
    removeChild,
    findTeacherByEmail,
    resolveUserDisplays,
  } = useSchool();
  const { profiles, sharedProfiles } = useChildProfile();

  const students = listChildrenForClassroom(classroom.id);
  const teachers = listTeachersForClassroom(classroom.id);

  const allProfiles = [...profiles, ...sharedProfiles];
  const profileMap = new Map(allProfiles.map((p) => [p.id, p.name]));

  // ── Teacher display map ───────────────────────────────────────────────────────
  const [teacherDisplays, setTeacherDisplays] = useState<Map<string, UserDisplayInfo>>(new Map());
  const teacherIdsKey = teachers.map((t) => t.teacherUserId).sort().join(",");
  useEffect(() => {
    const ids = teachers.map((t) => t.teacherUserId);
    if (ids.length === 0) { setTeacherDisplays(new Map()); return; }
    let cancelled = false;
    resolveUserDisplays(ids)
      .then((m) => { if (!cancelled) setTeacherDisplays(m); })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherIdsKey]);

  // ── Teacher email search form ─────────────────────────────────────────────────
  type SearchState = "idle" | "not-found" | UserDisplayInfo;
  const [teacherEmail, setTeacherEmail] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [searchBusy, setSearchBusy] = useState(false);
  const [assignBusy, setAssignBusy] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  async function handleSearchTeacher(e: React.FormEvent) {
    e.preventDefault();
    const email = teacherEmail.trim();
    if (!email) return;
    setSearchBusy(true);
    setSearchState("idle");
    setTeacherError("");
    try {
      const found = await findTeacherByEmail(email);
      setSearchState(found ?? "not-found");
    } catch {
      setSearchState("not-found");
    } finally {
      setSearchBusy(false);
    }
  }

  async function handleConfirmAddTeacher() {
    if (typeof searchState !== "object") return;
    setAssignBusy(true);
    setTeacherError("");
    try {
      await assignTeacher(classroom.id, searchState.userId);
      setTeacherEmail("");
      setSearchState("idle");
    } catch (err) {
      setTeacherError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleRemoveTeacher(teacherUserId: string) {
    try {
      await removeTeacher(classroom.id, teacherUserId);
    } catch {
      // silent
    }
  }

  // ── Add student form ──────────────────────────────────────────────────────────
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [childIdInput, setChildIdInput] = useState("");
  const [studentBusy, setStudentBusy] = useState(false);
  const [studentError, setStudentError] = useState("");

  const enrolledIds = new Set(students.map((s) => s.childId));

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    const cid = (selectedProfileId || childIdInput).trim();
    if (!cid) return;
    setStudentBusy(true);
    setStudentError("");
    try {
      await addChild(classroom.id, cid);
      setSelectedProfileId("");
      setChildIdInput("");
    } catch (err) {
      setStudentError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setStudentBusy(false);
    }
  }

  async function handleRemoveStudent(childId: string) {
    try {
      await removeChild(classroom.id, childId);
    } catch {
      // silent
    }
  }

  const meta = [
    classroom.gradeLevel ? `ชั้น ${classroom.gradeLevel}` : null,
    classroom.academicYear ? `ปี ${classroom.academicYear}` : null,
  ].filter(Boolean).join(" · ");

  const isResultFound = typeof searchState === "object";

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-text">{classroom.name}</h2>
          {meta && <p className="text-xs text-text-muted mt-0.5">{meta}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="ปิด"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex-shrink-0"
        >
          <XIcon />
        </button>
      </div>

      {/* ── Teachers ─────────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          ครูผู้สอน ({teachers.length})
        </p>

        {teachers.length > 0 ? (
          <ul className="space-y-2 mb-3">
            {teachers.map((t) => {
              const display = teacherDisplays.get(t.teacherUserId);
              return (
                <li
                  key={t.teacherUserId}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-bg border border-border"
                >
                  <div className="min-w-0">
                    {display ? (
                      <span className="text-xs text-text truncate">{display.email}</span>
                    ) : (
                      <span className="text-xs font-mono text-text-muted truncate" title={t.teacherUserId}>
                        {t.teacherUserId.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveTeacher(t.teacherUserId)}
                    aria-label="ลบครู"
                    className="flex-shrink-0 text-text-muted hover:text-error transition-colors p-1 rounded"
                  >
                    <TrashIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-text-muted italic mb-3">ยังไม่มีครูผู้สอน</p>
        )}

        {/* Email search */}
        <form onSubmit={handleSearchTeacher} className="flex gap-2">
          <input
            type="email"
            value={teacherEmail}
            onChange={(e) => { setTeacherEmail(e.target.value); setSearchState("idle"); setTeacherError(""); }}
            placeholder="ค้นหาครูด้วยอีเมล"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={searchBusy || !teacherEmail.trim()}
            className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 flex-shrink-0 flex items-center gap-1"
          >
            <SearchIcon />
            {searchBusy ? "…" : "ค้นหา"}
          </button>
        </form>

        {/* Found result */}
        {isResultFound && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 truncate">
                {(searchState as UserDisplayInfo).email}
              </p>
              {(searchState as UserDisplayInfo).role && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {(searchState as UserDisplayInfo).role}
                </p>
              )}
            </div>
            <button
              onClick={handleConfirmAddTeacher}
              disabled={assignBusy}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {assignBusy ? "…" : "เพิ่มครู"}
            </button>
          </div>
        )}

        {/* Not found */}
        {searchState === "not-found" && (
          <p className="mt-2 text-xs text-text-muted italic">
            ไม่พบผู้ใช้นี้ในระบบ กรุณาส่งคำเชิญก่อน
          </p>
        )}

        {teacherError && <p className="text-xs text-error mt-1">{teacherError}</p>}
      </section>

      {/* ── Students ─────────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          นักเรียน ({students.length})
        </p>

        {students.length > 0 ? (
          <ul className="space-y-2 mb-3">
            {students.map((s) => {
              const name = profileMap.get(s.childId);
              return (
                <li
                  key={s.childId}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-bg border border-border"
                >
                  <div className="min-w-0">
                    {name ? (
                      <span className="text-xs font-semibold text-text">{name}</span>
                    ) : (
                      <span className="text-xs font-mono text-text-muted" title={s.childId}>
                        {s.childId.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(s.childId)}
                    aria-label="ลบนักเรียน"
                    className="flex-shrink-0 text-text-muted hover:text-error transition-colors p-1 rounded"
                  >
                    <TrashIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-text-muted italic mb-3">ยังไม่มีนักเรียน</p>
        )}

        <form onSubmit={handleAddStudent} className="space-y-2">
          {allProfiles.length > 0 ? (
            <select
              value={selectedProfileId}
              onChange={(e) => { setSelectedProfileId(e.target.value); setChildIdInput(""); }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— เลือกเด็กจากโปรไฟล์ —</option>
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id} disabled={enrolledIds.has(p.id)}>
                  {p.name}{enrolledIds.has(p.id) ? " (อยู่แล้ว)" : ""}
                </option>
              ))}
            </select>
          ) : null}

          {!selectedProfileId && (
            <input
              type="text"
              value={childIdInput}
              onChange={(e) => setChildIdInput(e.target.value)}
              placeholder={allProfiles.length > 0 ? "หรือใส่ Child ID โดยตรง" : "Child ID ของนักเรียน (UUID)"}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}

          <button
            type="submit"
            disabled={studentBusy || !(selectedProfileId || childIdInput.trim())}
            className="w-full px-3 py-2 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary/90 transition-all disabled:opacity-50"
          >
            {studentBusy ? "กำลังเพิ่ม…" : "เพิ่มนักเรียน"}
          </button>
        </form>
        {studentError && <p className="text-xs text-error mt-1">{studentError}</p>}
      </section>
    </div>
  );
}
