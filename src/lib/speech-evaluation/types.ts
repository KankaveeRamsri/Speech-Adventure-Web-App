export type SpeechEvaluationProvider = "mock" | "openai";

/** @deprecated Use SpeechEvaluationProvider */
export type EvaluationProvider = SpeechEvaluationProvider;

export type EvaluationStatus = "passed" | "almost" | "retry";

export interface SpeechEvaluationInput {
  audioBlob?: Blob;
  /** Server-side: raw audio bytes from FormData upload. */
  audioBuffer?: Buffer;
  audioMimeType?: string;
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
  childId?: string;
  locale?: string;
}

export interface SpeechEvaluationResult {
  score: number;
  confidence: number;
  status: EvaluationStatus;
  feedback: string;
  recommendation?: string;
  transcript?: string;
  detectedIssues?: string[];
  isMock: boolean;
  provider: SpeechEvaluationProvider;
  createdAt: string;
}

export interface SpeechEvaluationProviderClient {
  evaluate(input: SpeechEvaluationInput): Promise<SpeechEvaluationResult>;
}
