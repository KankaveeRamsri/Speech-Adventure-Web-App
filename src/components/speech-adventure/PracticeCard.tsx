"use client";

import { useState } from "react";
import type { PracticeItem, PracticeState, EvaluationResult } from "@/types/speechAdventure";
import EvaluationResultCard from "./EvaluationResultCard";
import RewardBadge from "./RewardBadge";

interface Props {
  item: PracticeItem;
  accentColor: string;
  stageName: string;
  onNext?: () => void;
}

export default function PracticeCard({ item, accentColor, stageName, onNext }: Props) {
  const [state, setState] = useState<PracticeState>("idle");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showReward, setShowReward] = useState(false);

  const handleListen = () => {
    setState("listening");
    setTimeout(() => setState("idle"), 2000);
  };

  const handleRecord = () => {
    setState("recording");
    setTimeout(() => {
      setState("processing");
      setTimeout(() => {
        const results: EvaluationResult[] = [
          { score: 95, maxScore: 100, stars: 5, message: "ยอดเยี่ยม! เก่งมาก!", isPassed: true },
          { score: 80, maxScore: 100, stars: 4, message: "ดีมาก! ใกล้เก่งแล้ว!", isPassed: true },
          { score: 65, maxScore: 100, stars: 3, message: "พอใช้ได้! ลองอีกครั้งนะ!", isPassed: true },
        ];
        const randomResult = results[Math.floor(Math.random() * results.length)];
        setResult(randomResult);
        setState("result");
      }, 1500);
    }, 3000);
  };

  const handleRetry = () => {
    setState("idle");
    setResult(null);
    setShowReward(false);
  };

  const handleAccept = () => {
    setShowReward(true);
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

      {/* Action Buttons */}
      {state !== "result" && (
        <div className="flex justify-center gap-4 mb-6">
          {/* Listen Button */}
          <button
            onClick={handleListen}
            disabled={state === "listening" || state === "recording" || state === "processing"}
            className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all ${
              state === "listening"
                ? "bg-info/20 text-info animate-pulse-gentle"
                : "bg-bg text-text hover:bg-gray-100"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="ฟังเสียงตัวอย่าง"
          >
            <span className="text-3xl">{state === "listening" ? "🔊" : "🔈"}</span>
            <span className="text-sm font-medium">ฟังเสียง</span>
          </button>

          {/* Record Button */}
          <button
            onClick={handleRecord}
            disabled={state === "recording" || state === "processing" || state === "listening"}
            className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all ${
              state === "recording"
                ? "bg-error/20 text-error animate-glow-pulse"
                : state === "processing"
                ? "bg-secondary/20 text-secondary animate-pulse-gentle"
                : "bg-primary text-white hover:bg-primary/90"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={state === "recording" ? "กำลังบันทึกเสียง" : "บันทึกเสียงของฉัน"}
          >
            <span className="text-3xl">
              {state === "recording" ? "⏺️" : state === "processing" ? "⏳" : "🎙️"}
            </span>
            <span className="text-sm font-medium">
              {state === "recording"
                ? "กำลังบันทึก..."
                : state === "processing"
                ? "กำลังวิเคราะห์..."
                : "บันทึกเสียง"}
            </span>
          </button>

          {/* Replay (mock) */}
          <button
            disabled={state !== "idle"}
            className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-bg text-text hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="ฟังเสียงที่บันทึก"
          >
            <span className="text-3xl">🔄</span>
            <span className="text-sm font-medium">ฟังซ้ำ</span>
          </button>
        </div>
      )}

      {/* Recording Indicator */}
      {state === "recording" && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-error/10 text-error px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-error rounded-full animate-pulse" />
            กำลังบันทึกเสียง... พูดตอนนี้!
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {state === "processing" && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            AI กำลังวิเคราะห์เสียงของคุณ...
          </div>
        </div>
      )}

      {/* Result */}
      {state === "result" && result && !showReward && (
        <div className="animate-slide-up">
          <EvaluationResultCard result={result} accentColor={accentColor} />
          <div className="flex gap-3 mt-4">
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

      {/* Reward */}
      {showReward && result && (
        <div className="animate-bounce-in text-center">
          <RewardBadge stars={result.stars} message={result.message} />
          {onNext && (
            <button
              onClick={onNext}
              className="mt-4 w-full py-3 rounded-2xl bg-secondary text-white font-semibold text-lg hover:bg-secondary/90 transition-all active:scale-[0.98] shadow-md"
            >
              🚀 ภารกิจต่อไป
            </button>
          )}
        </div>
      )}
    </div>
  );
}
