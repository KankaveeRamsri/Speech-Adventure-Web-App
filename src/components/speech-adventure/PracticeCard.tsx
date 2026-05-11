"use client";

import { useState, useCallback } from "react";
import type {
  PracticeItem,
  EvaluationResult,
  MockEvaluationResult,
  PracticeAttempt,
} from "@/types/speechAdventure";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import AudioRecorder from "./AudioRecorder";
import EvaluationResultCard from "./EvaluationResultCard";
import RewardBadge from "./RewardBadge";
import SessionSummaryCard from "./SessionSummaryCard";

interface Props {
  item: PracticeItem;
  accentColor: string;
  stageName: string;
  targetSound: string;
  missionIndex?: number;
  totalMissions?: number;
  isLastMission?: boolean;
  onSaveAttempt?: (attempt: PracticeAttempt) => void;
  onNext?: () => void;
}

function generateMockEvaluation(): {
  mock: MockEvaluationResult;
  result: EvaluationResult;
} {
  const pool: Array<{ mock: MockEvaluationResult; result: EvaluationResult }> = [
    {
      mock: { score: 95, confidence: 0.97, status: "passed", feedback: "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก! เก่งจัง!", recommendation: "ลองฝึกระดับถัดไปได้เลยนะ", isMock: true },
      result: { score: 95, maxScore: 100, stars: 5, message: "ยอดเยี่ยม! เก่งมาก!", isPassed: true },
    },
    {
      mock: { score: 82, confidence: 0.85, status: "passed", feedback: "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว ใกล้เก่งแล้ว!", recommendation: "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อยนะ", isMock: true },
      result: { score: 82, maxScore: 100, stars: 4, message: "ดีมาก! ใกล้เก่งแล้ว!", isPassed: true },
    },
    {
      mock: { score: 68, confidence: 0.72, status: "almost", feedback: "ดีใจด้วย! เกือบจะผ่านแล้ว! ลองอีกสักครั้งนะ!", recommendation: "พยายามออกเสียงให้ช้าลงและชัดขึ้นอีกนิด", isMock: true },
      result: { score: 68, maxScore: 100, stars: 3, message: "ดีขึ้นแล้ว! ลองอีกครั้งนะ!", isPassed: true },
    },
    {
      mock: { score: 50, confidence: 0.55, status: "retry", feedback: "สู้ต่อนะ! ลองฟังเสียงตัวอย่างแล้วฝึกอีกครั้ง!", recommendation: "เริ่มจากการฟังเสียงตัวอย่างก่อน แล้วค่อยๆ ออกเสียงตาม", isMock: true },
      result: { score: 50, maxScore: 100, stars: 2, message: "พยายามอีกนิดนะ! เกือบแล้ว!", isPassed: false },
    },
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

function computeStars(score: number): number {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  return 1;
}

function buildAttempt(
  item: PracticeItem,
  targetSound: string,
  score: number,
  confidence: number,
  status: "passed" | "almost" | "retry",
  feedback: string,
  recommendation: string | undefined,
  durationMs: number
): PracticeAttempt {
  return {
    id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    childId: "child-001",
    stageId: item.stageSlug,
    practiceItemId: item.id,
    targetSound,
    promptText: item.target,
    durationMs,
    score,
    confidence,
    status,
    feedback,
    recommendation,
    starsEarned: computeStars(score),
    createdAt: new Date().toISOString(),
  };
}

const usesRecorder = (type: PracticeItem["type"]) =>
  type !== "oral_motor" && type !== "sound_choice";

export default function PracticeCard({
  item,
  accentColor,
  stageName,
  targetSound,
  missionIndex,
  totalMissions,
  isLastMission = false,
  onSaveAttempt,
  onNext,
}: Props) {
  const recorder = useAudioRecorder();
  const [phase, setPhase] = useState<
    "idle" | "listening" | "recording" | "evaluated" | "saved" | "reward"
  >("idle");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [mockEval, setMockEval] = useState<MockEvaluationResult | null>(null);
  const [savedAttempt, setSavedAttempt] = useState<PracticeAttempt | null>(null);

  // ── Recorder-based handlers ────────────────────────────────────────────────

  const handleListen = () => {
    setPhase("listening");
    setTimeout(() => setPhase("idle"), 2000);
  };

  const handleStartRecording = useCallback(() => {
    setPhase("recording");
    recorder.startRecording();
  }, [recorder]);

  const handleStopRecording = useCallback(() => {
    recorder.stopRecording();
    setPhase("idle");
  }, [recorder]);

  const handleEvaluate = useCallback(() => {
    const { mock, result: evalResult } = generateMockEvaluation();
    setResult(evalResult);
    setMockEval(mock);
    setPhase("evaluated");
  }, []);

  const handleRetry = useCallback(() => {
    recorder.clearRecording();
    setResult(null);
    setMockEval(null);
    setSavedAttempt(null);
    setPhase("idle");
  }, [recorder]);

  const handleAccept = useCallback(() => {
    if (!mockEval) return;
    const attempt = buildAttempt(
      item, targetSound, mockEval.score, mockEval.confidence,
      mockEval.status, mockEval.feedback, mockEval.recommendation,
      recorder.durationMs
    );
    setSavedAttempt(attempt);
    onSaveAttempt?.(attempt);
    setPhase("saved");
  }, [mockEval, item, targetSound, recorder.durationMs, onSaveAttempt]);

  const handleContinue = () => setPhase("reward");

  // ── Oral motor handler ─────────────────────────────────────────────────────

  const handleOralMotorComplete = useCallback(() => {
    const score = 75 + Math.floor(Math.random() * 21); // 75–95
    const evalResult: EvaluationResult = {
      score, maxScore: 100, stars: computeStars(score),
      message: "ยอดเยี่ยม! ทำภารกิจสำเร็จแล้ว!", isPassed: true,
    };
    setResult(evalResult);
    const attempt = buildAttempt(
      item, targetSound, score, 0.9, "passed",
      "ทำภารกิจ Oral Motor สำเร็จ!", undefined, 0
    );
    setSavedAttempt(attempt);
    onSaveAttempt?.(attempt);
    setPhase("reward");
  }, [item, targetSound, onSaveAttempt]);

  // ── Sound choice handler ───────────────────────────────────────────────────

  const handleSoundChoice = useCallback((choice: string) => {
    const isCorrect = choice === item.target;
    const score = isCorrect
      ? 80 + Math.floor(Math.random() * 16) // 80–95
      : 30 + Math.floor(Math.random() * 26); // 30–55
    const mock: MockEvaluationResult = {
      score,
      confidence: isCorrect ? 0.9 : 0.5,
      status: isCorrect ? "passed" : "retry",
      feedback: isCorrect
        ? `ถูกต้อง! "${choice}" ใช่เลย! น้องเก่งมาก!`
        : `ยังไม่ถูกนะ คำตอบที่ถูกคือ "${item.target}" ลองอีกครั้งนะ!`,
      recommendation: isCorrect ? undefined : "ฟังเสียงให้ดีแล้วลองเลือกใหม่นะ",
      isMock: true,
    };
    const evalResult: EvaluationResult = {
      score, maxScore: 100, stars: computeStars(score),
      message: isCorrect ? "ถูกต้อง! เก่งมาก!" : "ยังไม่ถูกนะ ลองอีกครั้ง!",
      isPassed: isCorrect,
    };
    setResult(evalResult);
    setMockEval(mock);
    setPhase("evaluated");
  }, [item.target]);

  // ── Target size by type ────────────────────────────────────────────────────

  const sizeClass =
    item.type === "sentence"
      ? "text-xl md:text-3xl"
      : item.type === "word"
      ? "text-3xl md:text-5xl"
      : item.type === "oral_motor"
      ? "text-2xl md:text-4xl"
      : "text-5xl md:text-7xl";

  const isPracticePhase =
    phase !== "evaluated" && phase !== "saved" && phase !== "reward";

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm animate-slide-up">
      {/* Header */}
      <div className="mb-4">
        {missionIndex !== undefined && totalMissions !== undefined && (
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-0.5">
            ภารกิจที่ {missionIndex + 1} / {totalMissions}
          </p>
        )}
        <p className="text-sm text-text-muted">{stageName}</p>
        <p className="text-base font-bold text-text">{item.instruction}</p>
      </div>

      {/* Target Display */}
      <div
        className="rounded-3xl p-8 text-center mb-6"
        style={{ backgroundColor: `${accentColor}12` }}
      >
        {item.type === "sound_choice" ? (
          /* Don't reveal the answer — show a musical note prompt */
          <>
            <p className="text-5xl mb-3" aria-hidden="true">
              {item.emoji ?? "🎵"}
            </p>
            <p className="text-base font-semibold text-text-muted">
              {item.instruction}
            </p>
          </>
        ) : (
          <>
            {item.emoji && (
              <p className="text-5xl mb-3" aria-hidden="true">{item.emoji}</p>
            )}
            <p className={`font-bold ${sizeClass}`} style={{ color: accentColor }}>
              {item.target}
            </p>
            {item.hint && isPracticePhase && (
              <p className="text-sm text-text-muted mt-3 italic leading-relaxed">
                💡 {item.hint}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Evaluated phase ────────────────────────────────────────────────── */}
      {phase === "evaluated" && result && mockEval && (
        <div className="animate-slide-up space-y-4">
          <EvaluationResultCard result={result} accentColor={accentColor} />

          <div
            className="rounded-2xl p-4 text-sm space-y-2"
            style={{ backgroundColor: `${accentColor}08` }}
          >
            <p className="font-semibold text-text">{mockEval.feedback}</p>
            {mockEval.recommendation && (
              <p className="text-text-muted">{mockEval.recommendation}</p>
            )}
            {usesRecorder(item.type) && (
              <p className="text-xs text-text-muted mt-2">
                💡 ผลประเมินนี้เป็นตัวอย่าง (Mock) ระบบ AI จริงยังไม่พร้อมใช้งาน
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 rounded-2xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              🔄 ลองอีกครั้ง
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              ✓ ยอมรับผล
            </button>
          </div>
        </div>
      )}

      {/* ── Saved phase ────────────────────────────────────────────────────── */}
      {phase === "saved" && savedAttempt && result && (
        <div className="animate-slide-up space-y-4">
          <SessionSummaryCard attempt={savedAttempt} accentColor={accentColor} />
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 rounded-2xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              🔄 ลองอีกครั้ง
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 py-3 rounded-2xl bg-secondary text-white font-semibold hover:bg-secondary/90 transition-all active:scale-[0.98] shadow-md"
            >
              🚀 ดูรางวัล
            </button>
          </div>
        </div>
      )}

      {/* ── Reward phase ───────────────────────────────────────────────────── */}
      {phase === "reward" && result && (
        <div className="animate-bounce-in text-center space-y-4">
          <RewardBadge stars={result.stars} message={result.message} />
          {onNext && (
            <button
              onClick={onNext}
              className="w-full py-3 rounded-2xl bg-secondary text-white font-semibold text-lg hover:bg-secondary/90 transition-all active:scale-[0.98] shadow-md"
            >
              {isLastMission ? "🏆 ดูผลสรุประดับ" : "🚀 ภารกิจต่อไป"}
            </button>
          )}
        </div>
      )}

      {/* ── Practice phase ─────────────────────────────────────────────────── */}
      {isPracticePhase && (
        <>
          {/* Oral Motor — single tap to complete */}
          {item.type === "oral_motor" && (
            <div className="text-center space-y-3">
              <p className="text-sm text-text-muted">
                ทำตามภารกิจด้านบน แล้วกดปุ่มเมื่อเสร็จ
              </p>
              <button
                onClick={handleOralMotorComplete}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-[0.98] shadow-md hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                ✅ เสร็จแล้ว!
              </button>
            </div>
          )}

          {/* Sound Choice — tap a button */}
          {item.type === "sound_choice" && item.soundChoices && (
            <div className="space-y-3">
              <p className="text-center text-sm text-text-muted font-medium">
                แตะตัวเลือกที่ถูกต้อง
              </p>
              <div className="grid grid-cols-2 gap-3">
                {item.soundChoices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleSoundChoice(choice)}
                    className="py-6 rounded-2xl border-2 border-gray-200 bg-bg text-2xl font-bold text-text hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.96]"
                  >
                    {choice}
                  </button>
                ))}
              </div>
              {item.hint && (
                <p className="text-center text-xs text-text-muted italic">
                  💡 {item.hint}
                </p>
              )}
            </div>
          )}

          {/* Recorder — for test, sound_production, word, sentence */}
          {usesRecorder(item.type) && (
            <>
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleListen}
                  disabled={
                    phase === "listening" ||
                    recorder.state === "recording" ||
                    recorder.state === "requesting_permission"
                  }
                  className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all ${
                    phase === "listening"
                      ? "bg-info/20 text-info animate-pulse-gentle"
                      : "bg-bg text-text hover:bg-gray-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label="ฟังเสียงตัวอย่าง"
                >
                  <span className="text-3xl">
                    {phase === "listening" ? "🔊" : "🔈"}
                  </span>
                  <span className="text-sm font-medium">ฟังเสียง</span>
                </button>
              </div>

              <AudioRecorder
                state={recorder.state}
                durationMs={recorder.durationMs}
                errorMessage={recorder.errorMessage}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onPlayRecording={recorder.playRecording}
                onClearRecording={handleRetry}
                onEvaluate={handleEvaluate}
                accentColor={accentColor}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
