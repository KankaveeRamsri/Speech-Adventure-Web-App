"use client";

import ListenAndChooseActivity from "./ListenAndChooseActivity";
import SayAfterMeActivity from "./SayAfterMeActivity";
import BlendSoundsActivity from "./BlendSoundsActivity";
import WordPracticeActivity from "./WordPracticeActivity";
import type { PhonicsPracticeItem, PhonicsActivityResult } from "@/types/phonics";

interface Props {
  item: PhonicsPracticeItem;
  onComplete: (result: PhonicsActivityResult) => void;
}

export default function PhonicsActivityRenderer({ item, onComplete }: Props) {
  switch (item.type) {
    case "listen_and_choose":
      return <ListenAndChooseActivity item={item} onComplete={onComplete} />;

    case "say_after_me":
      return <SayAfterMeActivity item={item} onComplete={onComplete} />;

    case "blend_sounds":
      return <BlendSoundsActivity item={item} onComplete={onComplete} />;

    case "simple_word":
    case "final_consonant":
    case "short_sentence":
      return <WordPracticeActivity item={item} onComplete={onComplete} />;

    default:
      return (
        <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center space-y-2">
          <p className="text-sm font-semibold text-text">กิจกรรมประเภทนี้ยังไม่รองรับ</p>
          <p className="text-xs text-text-muted">type: {(item as { type: string }).type}</p>
          <button
            type="button"
            onClick={() => onComplete({ passed: false, score: 0, status: "retry", feedback: "ข้ามไปก่อน", isMock: true, durationMs: 0 })}
            className="mt-3 px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:scale-[0.97]"
          >
            ข้ามไปก่อน
          </button>
        </div>
      );
  }
}
