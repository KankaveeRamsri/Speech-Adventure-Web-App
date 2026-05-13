"use client";

import type { TargetSound } from "@/types/speechAdventure";

interface Props {
  sounds: TargetSound[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function TargetSoundSelector({ sounds, selectedId, onSelect }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-text">เลือกเสียงพยัญชนะที่ต้องการฝึก</h3>
        <p className="text-xs text-text-muted mt-0.5">เลือกเสียงที่ต้องการพัฒนา ระบบจะปรับภารกิจให้เหมาะสม</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
        {sounds.map((sound) => {
          const isSelected = sound.id === selectedId;
          return (
            <button
              key={sound.id}
              onClick={() => onSelect(sound.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all hover:scale-[1.03] active:scale-[0.97] ${
                isSelected
                  ? "border-primary bg-primary/8 shadow-sm"
                  : "border-border bg-bg hover:border-primary/40 dark:bg-white/3"
              }`}
              aria-label={`เลือกเสียง ${sound.label}`}
              aria-pressed={isSelected}
            >
              <span className={`text-2xl font-bold leading-none ${isSelected ? "text-primary" : "text-text"}`}>
                {sound.label}
              </span>
              <span className={`text-xs leading-tight text-center ${isSelected ? "text-primary/70" : "text-text-muted"}`}>
                {sound.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
