"use client";

import { useState, useCallback } from "react";
import type {
  PracticeItem,
  EvaluationResult,
  MockEvaluationResult,
} from "@/types/speechAdventure";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import AudioRecorder from "./AudioRecorder";
import EvaluationResultCard from "./EvaluationResultCard";
import RewardBadge from "./RewardBadge";

interface Props {
  item: PracticeItem;
  accentColor: string;
  stageName: string;
  onNext?: () => void;
}

function generateMockEvaluation(): {
  mock: MockEvaluationResult;
  result: EvaluationResult;
} {
  const pool: Array<{
    mock: MockEvaluationResult;
    result: EvaluationResult;
  }> = [
    {
      mock: {
        score: 95,
        confidence: 0.97,
        status: "passed",
        feedback: "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก! เก่งจัง!",
        recommendation: "ลองฝึกระดับถัดไปได้เลยนะ",
        isMock: true,
      },
      result: {
        score: 95,
        maxScore: 100,
        stars: 5,
        message: "ยอดเยี่ยม! เก่งมาก!",
        isPassed: true,
      },
    },
    {
      mock: {
        score: 82,
        confidence: 0.85,
        status: "passed",
        feedback: "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว ใกล้เก่งแล้ว!",
        recommendation: "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อยนะ",
        isMock: true,
      },
      result: {
        score: 82,
        maxScore: 100,
        stars: 4,
        message: "ดีมาก! ใกล้เก่งแล้ว!",
        isPassed: true,
      },
    },
    {
      mock: {
        score: 68,
        confidence: 0.72,
        status: "almost",
        feedback: "ดีใจด้วย! เกือบจะผ่านแล้ว! ลองอีกสักครั้งนะ!",
        recommendation: "พยายามออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
        isMock: true,
      },
      result: {
        score: 68,
        maxScore: 100,
        stars: 3,
        message: "ดีขึ้นแล้ว! ลองอีกครั้งนะ!",
        isPassed: true,
      },
    },
    {
      mock: {
        score: 50,
        confidence: 0.55,
        status: "retry",
        feedback: "สู้ต่อนะ! ลองฟังเสียงตัวอย่างแล้วฝึกอีกครั้ง!",
        recommendation: "เริ่มจากการฟังเสียงตัวอย่างก่อน แล้วค่อยๆ ออกเสียงตาม",
        isMock: true,
      },
      result: {
        score: 50,
        maxScore: 100,
        stars: 2,
        message: "พยายามอีกนิดนะ! เกือบแล้ว!",
        isPassed: false,
      },
    },
  ];

  return pool[Math.floor(Math.random() * pool.length)];
}

export default function PracticeCard({
  item,
  accentColor,
  stageName,
  onNext,
}: Props) {
  const recorder = useAudioRecorder();
  const [phase, setPhase] = useState<
    "idle" | "listening" | "recording" | "evaluated" | "reward"
  >("idle");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [mockEval, setMockEval] = useState<MockEvaluationResult | null>(null);

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
    setPhase("idle");
  }, [recorder]);

  const handleAccept = () => {
    setPhase("reward");
  };

  const sizeClass =
    item.type === "sentence"
      ? "text-xl md:text-3xl"
      : item.type === "word"
      ? "text-3xl md:text-5xl"
      : "text-5xl md:text-7xl";

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-text-muted">{stageName}</p>
          <p className="text-lg font-bold text-text">{item.instruction}</p>
        </div>
      </div>

      {/* Target Display */}
      <div
        className="rounded-3xl p-8 text-center mb-6"
        style={{ backgroundColor: `${accentColor}12` }}
      >
        <p className={`font-bold ${sizeClass}`} style={{ color: accentColor }}>
          {item.target}
        </p>
      </div>

      {/* Evaluation result phase — show result card */}
      {phase === "evaluated" && result && mockEval && (
        <div className="animate-slide-up space-y-4">
          <EvaluationResultCard result={result} accentColor={accentColor} />

          {/* Mock evaluation details */}
          <div
            className="rounded-2xl p-4 text-sm space-y-2"
            style={{ backgroundColor: `${accentColor}08` }}
          >
            <p className="font-semibold text-text">{mockEval.feedback}</p>
            {mockEval.recommendation && (
              <p className="text-text-muted">{mockEval.recommendation}</p>
            )}
            <p className="text-xs text-text-muted mt-2">
              💡 ผลประเมินนี้เป็นตัวอย่าง (Mock) ระบบ AI จริงยังไม่พร้อมใช้งาน
            </p>
          </div>

          {/* Actions */}
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

      {/* Reward phase */}
      {phase === "reward" && result && (
        <div className="animate-bounce-in text-center space-y-4">
          <RewardBadge stars={result.stars} message={result.message} />
          {onNext && (
            <button
              onClick={onNext}
              className="w-full py-3 rounded-2xl bg-secondary text-white font-semibold text-lg hover:bg-secondary/90 transition-all active:scale-[0.98] shadow-md"
            >
              🚀 ภารกิจต่อไป
            </button>
          )}
        </div>
      )}

      {/* Practice phase — show listen + recorder */}
      {phase !== "evaluated" && phase !== "reward" && (
        <>
          {/* Listen Button */}
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

          {/* Audio Recorder */}
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
    </div>
  );
}
