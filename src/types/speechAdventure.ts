export type StageStatus = "completed" | "current" | "locked" | "review";

export type PracticeState = "idle" | "listening" | "recording" | "processing" | "result";

export interface ChildProfile {
  id: string;
  name: string;
  nickname: string;
  age: number;
  avatarEmoji: string;
  currentStage: string;
  totalStars: number;
  totalAttempts: number;
}

export interface TargetSound {
  id: string;
  label: string;
  description: string;
  isSelected: boolean;
}

export interface TrainingStage {
  id: string;
  slug: string;
  name: string;
  shortGoal: string;
  description: string;
  status: StageStatus;
  accentColor: string;
  icon: string;
  rewardPreview: string;
  starsEarned: number;
  starsTotal: number;
}

export interface PracticeItem {
  id: string;
  stageSlug: string;
  target: string;
  instruction: string;
  type: "sound" | "word" | "sentence";
}

export interface EvaluationResult {
  score: number;
  maxScore: number;
  stars: number;
  message: string;
  isPassed: boolean;
}

export interface ProgressSummary {
  pretestScore: number;
  reviewScore: number;
  currentLevel: string;
  totalStars: number;
  totalAttempts: number;
  difficultSounds: string[];
  accuracy: number;
}

export interface PracticeHistory {
  id: string;
  date: string;
  stageName: string;
  stageSlug: string;
  target: string;
  score: number;
  stars: number;
  isPassed: boolean;
}
