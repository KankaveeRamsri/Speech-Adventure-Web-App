/**
 * Lightweight home recommendation helpers for P6 Parent Dashboard.
 *
 * Pure functions — no React, no hooks.
 * Inputs are already-loaded data passed from hooks.
 * Only imports: types + pure data catalogs (no heavy UI modules).
 */

import type { ProgressSummary } from "@/types/speechAdventure";
import { getPhonicsUnits, getFirstPhonicsLesson } from "@/data/kindergartenCurriculum";
import { mockTrainingStages } from "@/data/speechAdventureMockData";

// ── Speech Clarity ────────────────────────────────────────────────────────────

export type SpeechAction = "pre-test" | "continue" | "retry" | "review";

export interface SpeechClarityRec {
  stageName: string;
  stageSlug: string;
  stageIcon: string;
  accentColor: string;
  action: SpeechAction;
}

/**
 * Returns the recommended next stage for speech_clarity mode.
 * Uses already-computed ProgressSummary from useSpeechProgress (no extra reads).
 */
export function getSpeechClarityHomeRecommendation(
  summary: ProgressSummary,
): SpeechClarityRec | null {
  // No attempts at all → start with pre-test
  if (summary.totalAttempts === 0) {
    const pretest = mockTrainingStages.find((s) => s.id === "pretest");
    if (!pretest) return null;
    return {
      stageName: pretest.name,
      stageSlug: pretest.slug,
      stageIcon: pretest.icon,
      accentColor: pretest.accentColor,
      action: "pre-test",
    };
  }

  const currentId = summary.currentStageId;
  const stage =
    mockTrainingStages.find((s) => s.id === currentId) ??
    mockTrainingStages.find((s) => s.id === "pretest");

  if (!stage) return null;

  const action: SpeechAction =
    currentId === "review" ? "review" : "continue";

  return {
    stageName: stage.name,
    stageSlug: stage.slug,
    stageIcon: stage.icon,
    accentColor: stage.accentColor,
    action,
  };
}

// ── Kindergarten Phonics ──────────────────────────────────────────────────────

export type PhonicsAction = "start" | "continue" | "next";

export interface PhonicsRec {
  unitId: string;
  lessonId: string;
  unitTitle: string;
  lessonTitle: string;
  action: PhonicsAction;
}

/**
 * Returns the recommended next lesson for kindergarten_phonics mode.
 * Iterates the curriculum in order; returns first unfinished lesson.
 */
export function getPhonicsHomeRecommendation(
  completedLessonIds: Set<string>,
): PhonicsRec | null {
  const units = getPhonicsUnits();
  const isFirstTime = completedLessonIds.size === 0;

  for (const unit of units) {
    for (const lesson of unit.lessons) {
      if (!completedLessonIds.has(lesson.id)) {
        return {
          unitId: unit.id,
          lessonId: lesson.id,
          unitTitle: unit.title,
          lessonTitle: lesson.title,
          action: isFirstTime ? "start" : "continue",
        };
      }
    }
  }

  // All lessons completed — suggest first lesson as a review loop
  const first = getFirstPhonicsLesson();
  if (!first) return null;
  return {
    unitId: first.unit.id,
    lessonId: first.lesson.id,
    unitTitle: first.unit.title,
    lessonTitle: first.lesson.title,
    action: "next",
  };
}
