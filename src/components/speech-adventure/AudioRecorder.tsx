"use client";

import type { RecordingState } from "@/types/speechAdventure";

interface Props {
  state: RecordingState;
  durationMs: number;
  errorMessage: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onClearRecording: () => void;
  onEvaluate: () => void;
  accentColor: string;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${seconds}.${tenths}s`;
}

export default function AudioRecorder({
  state,
  durationMs,
  errorMessage,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onClearRecording,
  onEvaluate,
  accentColor,
}: Props) {
  const isRecording = state === "recording";
  const hasRecording = state === "recorded";
  const canRecord = state === "idle";
  const isBusy =
    state === "requesting_permission" || state === "processing";
  const hasError =
    state === "permission_denied" ||
    state === "unsupported" ||
    state === "error";

  return (
    <div className="space-y-4">
      {/* Main recorder button */}
      <div className="flex justify-center">
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isBusy || hasRecording}
          className={`relative flex flex-col items-center gap-2 transition-all active:scale-[0.96] ${
            isRecording
              ? "w-36 h-36"
              : "w-28 h-28"
          }`}
          aria-label={
            isRecording
              ? "หยุดบันทึกเสียง"
              : canRecord
              ? "เริ่มบันทึกเสียง"
              : "บันทึกเสียง"
          }
        >
          {/* Outer glow ring for recording */}
          {isRecording && (
            <span className="absolute inset-0 rounded-full bg-error/20 animate-glow-pulse" />
          )}

          <span
            className={`relative flex items-center justify-center rounded-full transition-all ${
              isRecording
                ? "w-full h-full bg-error/20"
                : isBusy
                ? "w-full h-full bg-gray-200"
                : "w-full h-full"
            }`}
            style={
              !isRecording && !isBusy
                ? { backgroundColor: `${accentColor}15` }
                : undefined
            }
          >
            <span className={`text-5xl ${isRecording ? "animate-pulse" : ""}`}>
              {isRecording
                ? "⏺️"
                : state === "requesting_permission"
                ? "🎙️"
                : "🎙️"}
            </span>
          </span>

          <span
            className={`text-sm font-semibold ${
              isRecording ? "text-error" : "text-text"
            }`}
          >
            {isRecording
              ? "หยุดบันทึก"
              : state === "requesting_permission"
              ? "กำลังขอสิทธิ์..."
              : "บันทึกเสียงของฉัน"}
          </span>
        </button>
      </div>

      {/* Recording duration indicator */}
      {isRecording && (
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-error/10 text-error px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-error rounded-full animate-pulse" />
            กำลังบันทึกเสียง... พูดให้ชัดและสบายใจนะ
          </div>
        </div>
      )}

      {/* Recorded preview & actions */}
      {hasRecording && (
        <div className="animate-slide-up space-y-4">
          {/* Duration display */}
          <div className="text-center">
            <p className="text-sm text-text-muted">
              บันทึกเสร็จแล้ว! ได้เสียงยาว {formatDuration(durationMs)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={onPlayRecording}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-info/10 text-info font-semibold text-sm hover:bg-info/20 transition-all active:scale-[0.98]"
              aria-label="ฟังเสียงที่บันทึก"
            >
              🔊 ฟังเสียงของฉัน
            </button>

            <button
              onClick={onClearRecording}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 text-text-muted font-semibold text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
              aria-label="บันทึกใหม่"
            >
              🔄 บันทึกใหม่
            </button>

            <button
              onClick={onEvaluate}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold text-sm transition-all active:scale-[0.98] shadow-md hover:opacity-90"
              style={{ backgroundColor: accentColor }}
              aria-label="ประเมินเสียง"
            >
              ✨ ประเมินเสียง
            </button>
          </div>

          {/* Privacy note */}
          <p className="text-center text-xs text-text-muted mt-2">
            🔒 เสียงของคุณใช้เฉพาะการฝึกฝนในโปรโตไทป์นี้เท่านั้น ไม่มีการส่งข้อมูลออกไป
          </p>
        </div>
      )}

      {/* Error / permission states */}
      {hasError && errorMessage && (
        <div className="animate-slide-up text-center">
          <div className="inline-block bg-secondary/10 text-secondary px-5 py-3 rounded-2xl">
            <p className="text-sm font-medium">{errorMessage}</p>
            <button
              onClick={onClearRecording}
              className="mt-2 text-xs underline text-text-muted hover:text-text transition-colors"
            >
              ลองอีกครั้ง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
