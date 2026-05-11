import type { TrainingStage } from "@/types/speechAdventure";
import LevelCard from "./LevelCard";

interface Props {
  stages: TrainingStage[];
}

export default function TrainingMap({ stages }: Props) {
  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" aria-hidden="true" />

      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.id} className="relative">
            {/* Connector dot */}
            <div
              className={`absolute left-6 top-7 w-4 h-4 rounded-full border-2 border-white z-10 hidden md:block ${
                stage.status === "completed"
                  ? "bg-success"
                  : stage.status === "current"
                  ? "bg-primary animate-pulse-gentle"
                  : "bg-gray-300"
              }`}
              aria-hidden="true"
            />
            <div className="md:pl-14">
              <LevelCard stage={stage} index={index} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
