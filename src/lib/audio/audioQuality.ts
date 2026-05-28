export const MIN_AUDIO_DURATION_MS = 700;
export const MAX_AUDIO_DURATION_MS = 8000;
export const MIN_AUDIO_SIZE_BYTES = 1000;

export type AudioQualityReason =
  | "missing"
  | "too_short"
  | "too_long"
  | "too_quiet"
  | "silent"
  | "unknown";

export interface AudioQualityResult {
  ok: boolean;
  reason?: AudioQualityReason;
  message?: string;
  durationMs?: number;
  sizeBytes?: number;
}

export function validateRecordedAudio(
  blob: Blob | null | undefined,
  metadata: { durationMs: number },
): AudioQualityResult {
  if (!blob || blob.size === 0) {
    return {
      ok: false,
      reason: "missing",
      message: "ระบบยังไม่ได้ยินเสียง ลองพูดใกล้ไมค์อีกนิด",
    };
  }

  const { durationMs } = metadata;
  const sizeBytes = blob.size;

  if (durationMs < MIN_AUDIO_DURATION_MS) {
    return {
      ok: false,
      reason: "too_short",
      message: "เสียงสั้นเกินไป ลองพูดอีกครั้งนะ",
      durationMs,
      sizeBytes,
    };
  }

  if (durationMs > MAX_AUDIO_DURATION_MS) {
    return {
      ok: false,
      reason: "too_long",
      message: "เสียงยาวเกินไป ลองพูดสั้นลงนิดนึงนะ",
      durationMs,
      sizeBytes,
    };
  }

  if (sizeBytes < MIN_AUDIO_SIZE_BYTES) {
    return {
      ok: false,
      reason: "too_quiet",
      message: "เสียงเบาไปนิด ลองอัดใหม่อีกครั้ง",
      durationMs,
      sizeBytes,
    };
  }

  return { ok: true, durationMs, sizeBytes };
}
