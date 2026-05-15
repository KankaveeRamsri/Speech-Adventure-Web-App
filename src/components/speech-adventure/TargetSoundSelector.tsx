"use client";

import type { TargetSound } from "@/types/speechAdventure";

interface Props {
  sounds: TargetSound[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function TargetSoundSelector({ sounds, selectedId, onSelect }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-text">เลือกเสียงเป้าหมาย</h3>
        </div>
        {selectedId && (
          <span className="text-xs text-primary font-medium">กดเพื่อเปลี่ยน</span>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {sounds.map((sound) => {
          const isSelected = sound.id === selectedId;
          return (
            <button
              key={sound.id}
              onClick={() => onSelect(sound.id)}
              className={`relative flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
                isSelected
                  ? "border-primary bg-primary/8 shadow-sm"
                  : "border-transparent bg-bg hover:border-border dark:bg-white/3 hover:dark:border-white/10"
              }`}
              aria-label={`เลือกเสียง ${sound.label}`}
              aria-pressed={isSelected}
            >
              <span className={`text-2xl font-bold leading-none ${isSelected ? "text-primary" : "text-text"}`}>
                {sound.label}
              </span>
              <span className={`text-[11px] leading-tight text-center truncate w-full ${isSelected ? "text-primary/70" : "text-text-muted"}`}>
                {sound.description}
              </span>
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
