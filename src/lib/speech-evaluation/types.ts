export type EvaluationProvider = "mock" | "api";

export type EvaluationStatus = "passed" | "almost" | "retry";

export interface SpeechEvaluationInput {
  audioBlob?: Blob;
  audioUrl?: string;
  stageId: string;
  practiceItemId: string;
  targetSound: string;
  /** For recording types: the word/sentence being practiced.
   *  For sound_choice: the correct answer option. */
  promptText: string;
  itemType: string;
  durationMs: number;
  /** For sound_choice items: the option the user tapped. */
  selectedChoice?: string;
}

export interface SpeechEvaluationResult {
  score: number;
  confidence: number;
  status: EvaluationStatus;
  feedback: string;
  recommendation?: string;
  isMock: boolean;
  provider: EvaluationProvider;
  createdAt: string;
}
