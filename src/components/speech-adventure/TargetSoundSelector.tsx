"use client";

import type { TargetSound } from "@/types/speechAdventure";

interface Props {
  sounds: TargetSound[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function TargetSoundSelector({ sounds, selectedId, onSelect }: Props) {
  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-text mb-1">เลือกเสียงที่ต้องการฝึก</h3>
      <p className="text-sm text-text-muted mb-4">เลือกพยัญชนะที่น้องๆ ต้องการฝึกออกเสียง</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {sounds.map((sound) => {
          const isSelected = sound.id === selectedId;
          return (
            <button
              key={sound.id}
              onClick={() => onSelect(sound.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all hover:scale-[1.03] active:scale-[0.97] ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary shadow-md"
                  : "border-gray-200 bg-bg text-text hover:border-primary/30"
              }`}
              aria-label={`เลือกเสียง ${sound.label}`}
              aria-pressed={isSelected}
            >
              <span className="text-2xl font-bold">{sound.label}</span>
              <span className="text-xs opacity-60">{sound.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
