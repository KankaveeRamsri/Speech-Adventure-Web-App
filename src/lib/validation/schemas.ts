import { z } from "zod";

// ── Shared primitives ─────────────────────────────────────────────────────────

export const EvaluationStatusSchema = z.enum(["passed", "almost", "retry"]);
export const SessionStatusSchema = z.enum(["active", "completed", "abandoned"]);
export const ObservationTargetTypeSchema = z.enum([
  "session",
  "attempt",
  "general",
]);
export const ObservationCategorySchema = z.enum([
  "pronunciation",
  "attention",
  "progress",
  "recommendation",
  "other",
]);

// ── Child profile ─────────────────────────────────────────────────────────────

export const ChildProfileDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int(),
  targetSound: z.string().default(""),
  trainingGoal: z.string().default(""),
  createdAt: z.string().default(""),
  updatedAt: z.string().default(""),
});

// ── Practice attempt ──────────────────────────────────────────────────────────

export const PracticeAttemptSchema = z.object({
  id: z.string().min(1),
  childId: z.string().default(""),
  stageId: z.string().min(1),
  practiceItemId: z.string().min(1),
  targetSound: z.string().default(""),
  promptText: z.string().default(""),
  durationMs: z.number().default(0),
  score: z.number().min(0).max(100),
  confidence: z.number().default(0),
  status: EvaluationStatusSchema,
  feedback: z.string().default(""),
  recommendation: z.string().optional(),
  starsEarned: z.number().default(0),
  sessionId: z.string().optional(),
  createdAt: z.string().default(""),
});

// ── Practice session ──────────────────────────────────────────────────────────

export const PracticeSessionSchema = z.object({
  id: z.string().min(1),
  childId: z.string().default(""),
  targetSound: z.string().default(""),
  stageId: z.string().min(1),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  durationMs: z.number().optional(),
  completedMissions: z.number().default(0),
  totalMissions: z.number().default(0),
  averageScore: z.number().default(0),
  starsEarned: z.number().default(0),
  attemptIds: z.array(z.string()).default([]),
  status: SessionStatusSchema,
});

// ── Speech progress ───────────────────────────────────────────────────────────

export const SpeechProgressSchema = z.object({
  childId: z.string().min(1),
  targetSound: z.string().default(""),
  attempts: z.array(PracticeAttemptSchema).default([]),
  sessions: z.array(PracticeSessionSchema).default([]),
  updatedAt: z.string().default(""),
});

// ── Observation note ──────────────────────────────────────────────────────────

export const ObservationNoteSchema = z.object({
  id: z.string().min(1),
  childId: z.string().min(1),
  targetType: ObservationTargetTypeSchema,
  targetId: z.string().optional(),
  category: ObservationCategorySchema,
  title: z.string().default(""),
  content: z.string().default(""),
  createdAt: z.string().default(""),
  updatedAt: z.string().default(""),
});

export const ObservationNotesArraySchema = z
  .array(ObservationNoteSchema)
  .default([]);

// ── Selected sound ────────────────────────────────────────────────────────────

export const SelectedSoundIdSchema = z.string().min(1);
