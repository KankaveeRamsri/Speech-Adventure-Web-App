"use client";

import { useState } from "react";
import SampleAudioButton from "@/components/speech-adventure/SampleAudioButton";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { evaluateSpeechViaApi } from "@/lib/speech-evaluation/client";
import type { PhonicsPracticeItem, PhonicsActivityResult, PhonicsAttemptStatus } from "@/types/phonics";

interface Props {
  item: PhonicsPracticeItem;
  onComplete: (result: PhonicsActivityResult) => void;
}

interface EvalState {
  score: number;
  status: PhonicsAttemptStatus;
  feedback: string;
  isMock: boolean;
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
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalState | null>(null);
  const recorder = useAudioRecorder();

  const canProceed = listened || evalResult !== null;
  const isRecording = recorder.state === "recording";
  const hasRecording = recorder.blob !== null && recorder.state !== "recording";
  const canEvaluate = hasRecording && !evaluating && evalResult === null;
  const isSentence = item.type === "short_sentence";

  const handleEvaluate = async () => {
    if (!recorder.blob) return;
    setEvaluating(true);
    try {
      const result = await evaluateSpeechViaApi({
        stageId: `phonics-${item.id}`,
        practiceItemId: item.id,
        targetSound: "phonics",
        promptText: item.prompt,
        itemType: item.type,
        durationMs: recorder.durationMs,
        audioBlob: recorder.blob,
        trainingMode: "kindergarten_phonics",
      });
      setEvalResult({ score: result.score, status: result.status as PhonicsAttemptStatus, feedback: result.feedback, isMock: result.isMock });
      setListened(true);
    } catch {
      setEvalResult({ score: 60, status: "passed", feedback: "ดีมาก ลองอีกครั้งได้เลย 😊", isMock: true });
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    const r = evalResult ?? { score: 60, status: "passed" as const, feedback: "ดีมาก!", isMock: true };
    onComplete({ passed: r.status !== "retry", score: r.score, status: r.status, feedback: r.feedback, isMock: r.isMock, durationMs: recorder.durationMs });
  };

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

      {hasRecording && !evalResult && (
        <div className="animate-slide-up flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <button type="button" onClick={recorder.playRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-sm font-semibold hover:bg-blue-100 transition-all active:scale-[0.97]">
              <PlayIcon /> ฟังเสียงของฉัน
            </button>
            <button type="button" onClick={recorder.clearRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-text-muted text-sm font-semibold hover:bg-gray-100 dark:hover:bg-white/8 transition-all active:scale-[0.97]">
              อัดใหม่
            </button>
          </div>
          {canEvaluate && (
            <button type="button" onClick={handleEvaluate} disabled={evaluating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 text-sm font-semibold hover:bg-amber-200 transition-all active:scale-[0.97] disabled:opacity-50">
              {evaluating ? "กำลังตรวจสอบ..." : "✨ ตรวจสอบเสียง"}
            </button>
          )}
        </div>
      )}

      {evalResult && (
        <div className={`animate-slide-up rounded-xl px-4 py-3 text-center border ${
          evalResult.status === "passed" ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50"
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700/50"
        }`}>
          <p className={`font-bold text-base ${evalResult.status === "passed" ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
            {evalResult.feedback}
          </p>
          <p className="text-xs text-text-muted mt-1">คะแนน {evalResult.score}/100</p>
        </div>
      )}

      <button type="button" onClick={handleNext} disabled={!canProceed}
        className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all active:scale-[0.98] ${
          canProceed ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-300/40"
            : "bg-border/40 text-text-muted/50 cursor-not-allowed"
        }`}>
        ถัดไป →
      </button>

      {!canProceed && (
        <p className="text-center text-xs text-text-muted/60">ฟังเสียงตัวอย่างก่อน แล้วกด ถัดไป ได้เลย</p>
      )}
    </div>
  );
}
