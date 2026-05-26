import type { TrainingStage } from "@/types/speechAdventure";
import LevelCard from "./LevelCard";

interface Props {
  stages: TrainingStage[];
  /** When false, practice start CTAs in each LevelCard are disabled. */
  canStartPractice?: boolean;
}

export default function TrainingMap({ stages, canStartPractice = true }: Props) {
  return (
    <div className="space-y-2.5">
      {stages.map((stage, index) => (
        <LevelCard key={stage.id} stage={stage} index={index} canStartPractice={canStartPractice} />
      ))}
    </div>
  );
}

