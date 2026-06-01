/**
 * Type definitions for Kindergarten Phonics Mode.
 *
 * Entirely separate from the Speech Clarity types in speechAdventure.ts.
 * Phonics progress is NOT stored in SpeechProgress — see K3+ for progress storage.
 */

// ── Activity types ────────────────────────────────────────────────────────────

/** The kind of interaction a PhonicsPracticeItem uses. */
export type PhonicsActivityType =
  | "listen_and_choose" // Hear a sound, tap the correct consonant/vowel card
  | "say_after_me"      // Hear the model then speak it back
  | "blend_sounds"      // Combine initial consonant + vowel → syllable
  | "simple_word"       // Produce a complete CVC/CV word
  | "final_consonant"   // Word with a closing consonant
  | "short_sentence";   // A 2–4 word Thai sentence

// ── Evaluation ────────────────────────────────────────────────────────────────

/**
 * How strictly AI evaluates a phonics attempt.
 * - none  → no AI scoring (used for listen_and_choose / tap activities)
 * - light → gentle scoring; passing threshold is lower; no clinical wording
 */
export type PhonicsEvaluationMode = "none" | "light";

export interface PhonicsEvaluationRubric {
  /** Score threshold (0–100) to mark an attempt as "passed". */
  passingScore: number;
  evaluationMode: PhonicsEvaluationMode;
  /** Child-friendly feedback strings, randomly sampled by the UI. */
  childFriendlyFeedback: {
    passed: string[];
    almost: string[];
    retry: string[];
  };
  /** Hints sent to the AI evaluator prompt (light mode only). */
  scoringNote: string;
}

// ── Curriculum items ──────────────────────────────────────────────────────────

export interface PhonicsPracticeItem {
  id: string;
  type: PhonicsActivityType;
  /** The main consonant/vowel/syllable/word/sentence to practice. */
  prompt: string;
  /** Text passed to the TTS sample-audio provider. */
  sampleAudioText: string;
  /** Short instruction shown above the activity card (Thai). */
  instruction: string;
  emoji?: string;
  /** Card options shown for listen_and_choose. */
  choices?: string[];
  /** The correct card to tap (listen_and_choose only). */
  correctAnswer?: string;
  evaluationMode: PhonicsEvaluationMode;
}

export interface PhonicsLesson {
  id: string;
  /** Parent unit id (e.g. "K1"). */
  unitId: string;
  /** 1-based display order within the unit. */
  order: number;
  title: string;
  subtitle?: string;
  items: PhonicsPracticeItem[];
}

export interface PhonicsUnit {
  /** Short unit key: "K1"–"K7". */
  id: string;
  /** 1-based display order. */
  order: number;
  title: string;
  description: string;
  icon: string;
  /** Tailwind color class suffix used for theme. Resolved to amber/orange palette. */
  accentColor: string;
  lessons: PhonicsLesson[];
}

// ── Progress types ────────────────────────────────────────────────────────────

export type PhonicsAttemptStatus = "passed" | "almost" | "retry";

/** Result returned by an activity component to its parent. */
export interface PhonicsActivityResult {
  passed: boolean;
  score: number;
  status: PhonicsAttemptStatus;
  feedback: string;
  isMock: boolean;
  durationMs: number;
}

/** Persisted record of a single practice attempt (one item). */
export interface PhonicsAttempt {
  id: string;
  childId: string;
  /** Always "kindergarten_phonics" — ensures no mixing with speech_progress. */
  trainingMode: "kindergarten_phonics";
  unitId: string;
  lessonId: string;
  practiceItemId: string;
  activityType: PhonicsActivityType;
  prompt: string;
  score: number;
  status: PhonicsAttemptStatus;
  feedback: string;
  starsEarned: number;
  sessionId?: string;
  durationMs: number;
  isMock: boolean;
  createdAt: string;
}

export type PhonicsSessionStatus = "active" | "completed" | "abandoned";

export interface PhonicsSession {
  id: string;
  childId: string;
  unitId: string;
  lessonId: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  completedItems: number;
  totalItems: number;
  averageScore: number;
  starsEarned: number;
  attemptIds: string[];
  status: PhonicsSessionStatus;
}

/** All phonics progress for one child. Stored separately from SpeechProgress. */
export interface PhonicsProgress {
  childId: string;
  attempts: PhonicsAttempt[];
  sessions: PhonicsSession[];
  updatedAt: string;
}

export interface PhonicsProgressSummary {
  totalAttempts: number;
  totalSessions: number;
  completedLessonIds: string[];
  completedUnitIds: string[];
  lessonPassRate: Record<string, number>; // lessonId → 0-100
}
