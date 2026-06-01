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
