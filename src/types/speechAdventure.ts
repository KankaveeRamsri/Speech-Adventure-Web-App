export type StageStatus = "completed" | "current" | "locked" | "review";

export type PracticeState = "idle" | "listening" | "recording" | "processing" | "result";

export type RecordingState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "recorded"
  | "processing"
  | "result"
  | "permission_denied"
  | "unsupported"
  | "error";

export type EvaluationStatus = "passed" | "almost" | "retry";

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
  emoji?: string;
  hint?: string;
}

export interface EvaluationResult {
  score: number;
  maxScore: number;
  stars: number;
  message: string;
  isPassed: boolean;
}

export interface MockEvaluationResult {
  score: number;
  confidence: number;
  status: EvaluationStatus;
  feedback: string;
  recommendation?: string;
  isMock: true;
}

export interface AudioAttempt {
  id: string;
  stageId: string;
  practiceItemId: string;
  audioUrl: string;
  durationMs: number;
  createdAt: string;
  evaluation?: MockEvaluationResult;
}

export interface PracticeAttempt {
  id: string;
  childId: string;
  stageId: string;
  practiceItemId: string;
  targetSound: string;
  promptText: string;
  durationMs: number;
  score: number;
  confidence: number;
  status: EvaluationStatus;
  feedback: string;
  recommendation?: string;
  starsEarned: number;
  createdAt: string;
}

export interface SpeechProgress {
  childId: string;
  targetSound: string;
  attempts: PracticeAttempt[];
  updatedAt: string;
}

export interface DifficultItem {
  practiceItemId: string;
  promptText: string;
  averageScore: number;
  attempts: number;
}

export interface ProgressSummary {
  totalAttempts: number;
  averageScore: number;
  starsEarned: number;
  completedStages: number;
  currentStageId: string;
  pretestScore: number;
  reviewScore: number;
  improvement: number;
  accuracy: number;
  currentLevel: string;
  difficultSounds: string[];
  difficultItems: DifficultItem[];
  recentAttempts: PracticeAttempt[];
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
