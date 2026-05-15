import type { TrainingStage } from "@/types/speechAdventure";
import LevelCard from "./LevelCard";

interface Props {
  stages: TrainingStage[];
}

export default function TrainingMap({ stages }: Props) {
  return (
    <div className="space-y-2.5">
      {stages.map((stage, index) => (
        <LevelCard key={stage.id} stage={stage} index={index} />
      ))}
    </div>
  );
}
