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

export type { SpeechEvaluationInput, SpeechEvaluationResult, EvaluationProvider } from "@/lib/speech-evaluation/types";

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

export type PracticeItemType =
  | "test"
  | "oral_motor"
  | "sound_choice"
  | "sound_production"
  | "word"
  | "sentence";

export interface PracticeItem {
  id: string;
  stageSlug: string;
  target: string;
  instruction: string;
  type: PracticeItemType;
  emoji?: string;
  hint?: string;
  /** Choices shown for sound_choice type. target is the correct answer. */
  soundChoices?: string[];
}

export interface EvaluationResult {
  score: number;
  maxScore: number;
  stars: number;
  message: string;
  isPassed: boolean;
}

/** @deprecated Use SpeechEvaluationResult from @/lib/speech-evaluation/types */
export type MockEvaluationResult = import("@/lib/speech-evaluation/types").SpeechEvaluationResult;

export interface AudioAttempt {
  id: string;
  stageId: string;
  practiceItemId: string;
  audioUrl: string;
  durationMs: number;
  createdAt: string;
  evaluation?: import("@/lib/speech-evaluation/types").SpeechEvaluationResult;
}

export type SessionStatus = "active" | "completed" | "abandoned";

export interface PracticeSession {
  id: string;
  childId: string;
  targetSound: string;
  stageId: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  completedMissions: number;
  totalMissions: number;
  averageScore: number;
  starsEarned: number;
  attemptIds: string[];
  status: SessionStatus;
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
  sessionId?: string;
  createdAt: string;
  /** Supabase Storage path set after a successful audio upload (Phase 35+). */
  audioPath?: string;
  /** AI transcript of the spoken audio. Populated by OpenAI provider. */
  transcript?: string;
  /** Short practice tip from AI evaluation. */
  practiceTip?: string;
  /** Issues detected by AI evaluation (e.g. mispronunciation patterns). */
  detectedIssues?: string[];
  /** False when evaluated by real AI (OpenAI); true or undefined = mock. */
  isMock?: boolean;
}

export interface SpeechProgress {
  childId: string;
  targetSound: string;
  attempts: PracticeAttempt[];
  sessions: PracticeSession[];
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
  totalSessions: number;
  averageSessionScore: number;
  recentSessions: PracticeSession[];
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
