"use client";

import Link from "next/link";
import type { TeacherStudentProfile } from "@/types/school";

interface Props {
  profile: TeacherStudentProfile;
}

const TRAINING_MODE_LABELS: Record<string, string> = {
  speech_clarity: "ฝึกความชัดของเสียงพูด",
  kindergarten_phonics: "โฟนิกส์อนุบาล",
};

/**
 * Student Detail header. Shows only reliable profile info. No internal IDs,
 * no "organization" terminology. For a teacher-managed student we do not
 * imply a parent connection; for a parent-shared student we show nothing
 * about the parent's account.
 */
export default function StudentDetailHeader({ profile }: Props) {
  const displayName = profile.nickname
    ? `${profile.name} (${profile.nickname})`
    : profile.name;

  const meta: string[] = [];
  if (profile.age != null) meta.push(`อายุ ${profile.age} ปี`);
  if (profile.gradeLevel) meta.push(`ชั้น ${profile.gradeLevel}`);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
          {profile.avatarEmoji ?? displayName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-text leading-tight">{displayName}</h1>
          {meta.length > 0 && (
            <p className="text-sm text-text-muted mt-0.5">{meta.join(" · ")}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {profile.classrooms.map((c) => (
              <Link
                key={c.id}
                href={`/teacher/classrooms/${c.id}`}
                className="inline-flex items-center px-2 py-0.5 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
              >
                {c.name}
              </Link>
            ))}
            {profile.teacherManaged && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-border/50 text-text-muted text-xs">
                นักเรียนในความดูแลของคุณครู
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-border/40 text-text-muted text-xs">
              {TRAINING_MODE_LABELS[profile.trainingMode] ?? profile.trainingMode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
