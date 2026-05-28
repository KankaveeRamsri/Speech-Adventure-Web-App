"use client";

import { useEffect } from "react";
import { mockTrainingStages } from "@/data/speechAdventureMockData";
import type { PracticeAttempt, PracticeSession, EvaluationStatus } from "@/types/speechAdventure";
import DetailMetricCard from "./DetailMetricCard";
import LinkedObservationNotes from "./LinkedObservationNotes";
import AttemptAudioPlayer from "./AttemptAudioPlayer";
import PermissionBanner from "@/components/ui/PermissionBanner";
import { useCurrentChildAccess } from "@/hooks/useCurrentChildAccess";

interface Props {
  attempt: PracticeAttempt | null;
  linkedSession?: PracticeSession | null;
  onClose: () => void;
  onSessionClick?: (session: PracticeSession) => void;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} วินาที`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes} นาที ${seconds} วินาที` : `${minutes} นาที`;
}

const ATTEMPT_STATUS_INFO: Record<EvaluationStatus, { label: string; color: string }> = {
  passed: { label: "ผ่าน", color: "#4CAF82" },
  almost: { label: "เกือบผ่าน", color: "#FFB347" },
  retry: { label: "ต้องฝึกเพิ่ม", color: "#E57373" },
};

export default function AttemptDetailDrawer({ attempt, linkedSession, onClose, onSessionClick }: Props) {
  const { canViewAudio } = useCurrentChildAccess();
  useEffect(() => {
    if (!attempt) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [attempt]);

  useEffect(() => {
    if (!attempt) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [attempt, onClose]);

  if (!attempt) return null;

  const stage = mockTrainingStages.find((s) => s.id === attempt.stageId);
  const accentColor = stage?.accentColor ?? "#6C63FF";
  const statusInfo = ATTEMPT_STATUS_INFO[attempt.status] ?? ATTEMPT_STATUS_INFO.retry;
  const sessionStage = linkedSession
    ? mockTrainingStages.find((s) => s.id === linkedSession.stageId)
    : null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="รายละเอียดการฝึก">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-surface shadow-2xl overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-border">
          <div className="h-1" style={{ backgroundColor: accentColor }} />
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0" aria-hidden="true">{stage?.icon ?? "🎯"}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text truncate">{stage?.name ?? attempt.stageId}</p>
                <p className="text-xs text-text-muted">รายละเอียดการฝึก</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              aria-label="ปิด"
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5">

          {/* Status + sound */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: statusInfo.color }}
            >
              {statusInfo.label}
            </span>
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              เสียง {attempt.targetSound}
            </span>
          </div>

          {/* Prompt text */}
          <div className="bg-bg dark:bg-white/5 border border-border rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">คำ / ประโยคที่ฝึก</p>
            <p className="text-lg font-bold text-text">{attempt.promptText}</p>
          </div>

          {/* Transcript (AI heard) */}
          {attempt.transcript && (
            <div className="bg-bg dark:bg-white/5 border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">ที่ AI ได้ยิน</p>
              <p className="text-base font-medium text-text">&ldquo;{attempt.transcript}&rdquo;</p>
              <p className="text-xs text-text-muted mt-1.5">
                {attempt.confidence >= 0.8
                  ? "ฟังได้ชัดเจน"
                  : attempt.confidence >= 0.55
                  ? "ค่อนข้างชัด"
                  : "เสียงยังไม่ชัด ลองอัดใหม่อีกครั้ง"}
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailMetricCard
              label="คะแนน"
              value={`${attempt.score}%`}
              valueColor={attempt.score >= 70 ? "#4CAF82" : attempt.score >= 50 ? "#FFB347" : "#E57373"}
            />
            <DetailMetricCard
              label="ความแม่นยำ"
              value={`${Math.round(attempt.confidence * 100)}%`}
              valueColor="#6C63FF"
            />
            <DetailMetricCard
              label="ดาวที่ได้รับ"
              value={attempt.starsEarned > 0 ? `★ ${attempt.starsEarned}` : "—"}
              valueColor="#FFB347"
            />
            <DetailMetricCard
              label="เวลาที่ใช้"
              value={attempt.durationMs ? formatDuration(attempt.durationMs) : "—"}
              valueColor="#5BC0EB"
            />
          </div>

          {/* Date & stage */}
          <div className="bg-bg dark:bg-white/5 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-text-muted flex-shrink-0">วันที่ฝึก</span>
              <span className="font-medium text-text text-right">{formatDateTime(attempt.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-text-muted flex-shrink-0">ระดับ</span>
              <span className="font-medium text-text text-right">{stage?.name ?? attempt.stageId}</span>
            </div>
          </div>

          {/* Audio playback — gated by canViewAudio permission */}
          {attempt.audioPath && (
            canViewAudio ? (
              <AttemptAudioPlayer
                audioPath={attempt.audioPath}
                accentColor={accentColor}
              />
            ) : (
              <PermissionBanner
                message="คุณมีสิทธิ์ดูเท่านั้น"
                hint="ต้องได้รับสิทธิ์จากผู้ดูแลเด็กเพื่อฟังเสียงที่บันทึก"
              />
            )
          )}

          {/* Feedback */}
          {attempt.feedback && (
            <div className="bg-info/8 border border-info/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-info mb-1.5">ผลการประเมิน</p>
              <p className="text-sm text-text leading-relaxed">{attempt.feedback}</p>
            </div>
          )}

          {/* Recommendation */}
          {attempt.recommendation && (
            <div className="bg-primary/8 border border-primary/15 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary mb-1.5">คำแนะนำ</p>
              <p className="text-sm text-text leading-relaxed">{attempt.recommendation}</p>
            </div>
          )}

          {/* Practice tip */}
          {attempt.practiceTip && (
            <div className="bg-success/8 border border-success/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-success mb-1.5">เคล็ดลับการฝึก</p>
              <p className="text-sm text-text leading-relaxed">{attempt.practiceTip}</p>
            </div>
          )}

          {/* Detected issues */}
          {attempt.detectedIssues && attempt.detectedIssues.length > 0 && (
            <div className="bg-warning/8 border border-warning/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-warning mb-2">ปัญหาที่ AI ตรวจพบ</p>
              <ul className="space-y-1">
                {attempt.detectedIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text">
                    <span className="text-warning flex-shrink-0 mt-0.5 font-bold">·</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Linked session */}
          {linkedSession && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                เซสชันที่เชื่อมโยง
              </p>
              <button
                type="button"
                onClick={() => onSessionClick?.(linkedSession)}
                disabled={!onSessionClick}
                className={`w-full flex items-center gap-3 bg-bg dark:bg-white/3 rounded-xl px-4 py-3 border border-border text-left transition-all ${
                  onSessionClick
                    ? "hover:border-primary/30 hover:shadow-sm active:scale-[0.99] cursor-pointer"
                    : "cursor-default"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: `${sessionStage?.accentColor ?? "#6C63FF"}15` }}
                  aria-hidden="true"
                >
                  {sessionStage?.icon ?? "🎯"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {sessionStage?.name ?? linkedSession.stageId}
                  </p>
                  <p className="text-xs text-text-muted">
                    {linkedSession.averageScore}% · ★ {linkedSession.starsEarned}
                  </p>
                </div>
                {onSessionClick && (
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="text-text-muted flex-shrink-0" aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Observation notes */}
          <div className="bg-bg dark:bg-white/5 border border-border rounded-xl p-4">
            <LinkedObservationNotes
              childId={attempt.childId}
              targetType="attempt"
              targetId={attempt.id}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl border-2 border-border text-text font-semibold text-sm hover:bg-bg dark:hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
