import type { TrainingStage } from "@/types/speechAdventure";
import LevelCard from "./LevelCard";

interface Props {
  stages: TrainingStage[];
}

export default function TrainingMap({ stages }: Props) {
  return (
    <div className="relative">
      {/* Vertical connector line (desktop) */}
      <div
        className="absolute left-5 top-5 bottom-5 w-px hidden md:block"
        style={{ background: "linear-gradient(to bottom, #E2E8F0, #E2E8F0)" }}
        aria-hidden="true"
      />

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.id} className="relative flex items-start gap-4">
            {/* Connector node (desktop) */}
            <div
              className={`hidden md:flex flex-shrink-0 mt-4 w-10 h-10 items-center justify-center z-10`}
              aria-hidden="true"
            >
              <div
                className={`w-3 h-3 rounded-full border-2 border-surface ${
                  stage.status === "completed"
                    ? "bg-success"
                    : stage.status === "current"
                    ? "animate-pulse-gentle"
                    : "bg-border"
                }`}
                style={
                  stage.status === "current"
                    ? { backgroundColor: stage.accentColor }
                    : undefined
                }
              />
            </div>

            {/* Level card */}
            <div className="flex-1 min-w-0 md:-ml-10 md:pl-14">
              <LevelCard stage={stage} index={index} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
