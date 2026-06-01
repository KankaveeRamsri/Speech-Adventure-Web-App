"use client";

import { useState } from "react";
import SampleAudioButton from "@/components/speech-adventure/SampleAudioButton";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { PhonicsPracticeItem } from "@/types/phonics";

interface Props {
  item: PhonicsPracticeItem;
  onComplete: (passed: boolean) => void;
}

const TYPE_LABEL: Record<string, string> = {
  simple_word: "คำ",
  final_consonant: "คำ (มีตัวสะกด)",
  short_sentence: "ประโยค",
};

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export default function WordPracticeActivity({ item, onComplete }: Props) {
  const [listened, setListened] = useState(false);
  const recorder = useAudioRecorder();

  const canProceed = listened || recorder.blob !== null;
  const isRecording = recorder.state === "recording";
  const hasRecording = recorder.blob !== null && recorder.state !== "recording";
  const isSentence = item.type === "short_sentence";

  return (
    <div className="space-y-6">
      {/* Prompt */}
      <div className="text-center space-y-2">
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          {TYPE_LABEL[item.type] ?? item.type}
        </p>

        {item.emoji && (
          <div className="text-5xl mb-1" aria-hidden="true">{item.emoji}</div>
        )}

        <div
          className={`font-bold text-text tracking-wide py-2 ${
            isSentence ? "text-4xl" : "text-7xl"
          }`}
        >
          {item.prompt}
        </div>

        <p className="text-sm text-text-muted">{item.instruction}</p>
      </div>

      {/* Sample audio */}
      <div className="flex justify-center">
        <SampleAudioButton
          expectedText={item.sampleAudioText}
          stageId={`phonics-${item.id}`}
          onPlayed={() => setListened(true)}
        />
      </div>

      {/* Record */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-text-muted/70 font-medium uppercase tracking-wider">
          ลองพูดตาม
        </p>
        <button
          type="button"
          onClick={isRecording ? recorder.stopRecording : recorder.startRecording}
          disabled={
            recorder.state === "requesting_permission" ||
            recorder.state === "processing" ||
            hasRecording
          }
          aria-label={isRecording ? "หยุดบันทึก" : "เริ่มบันทึกเสียง"}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-[0.94] disabled:cursor-not-allowed ${
            isRecording
              ? "bg-red-100 dark:bg-red-950/40 text-red-500 animate-pulse"
              : hasRecording
              ? "bg-border/30 text-text-muted/40"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50"
          }`}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>
        <span className="text-sm text-text-muted">
          {isRecording
            ? "กำลังบันทึก... กดหยุดเมื่อพูดเสร็จ"
            : hasRecording
            ? "บันทึกเสร็จแล้ว ✅"
            : "กดเพื่อบันทึกเสียง"}
        </span>
      </div>

      {hasRecording && (
        <div className="animate-slide-up flex justify-center gap-3">
          <button
            type="button"
            onClick={recorder.playRecording}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-sm font-semibold hover:bg-blue-100 transition-all active:scale-[0.97]"
          >
            <PlayIcon />
            ฟังเสียงของฉัน
          </button>
          <button
            type="button"
            onClick={recorder.clearRecording}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-text-muted text-sm font-semibold hover:bg-gray-100 dark:hover:bg-white/8 transition-all active:scale-[0.97]"
          >
            อัดใหม่
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onComplete(true)}
        disabled={!canProceed}
        className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all active:scale-[0.98] ${
          canProceed
            ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-300/40"
            : "bg-border/40 text-text-muted/50 cursor-not-allowed"
        }`}
      >
        ถัดไป →
      </button>

      {!canProceed && (
        <p className="text-center text-xs text-text-muted/60">
          ฟังเสียงตัวอย่างก่อน แล้วกด ถัดไป ได้เลย
        </p>
      )}
    </div>
  );
}
