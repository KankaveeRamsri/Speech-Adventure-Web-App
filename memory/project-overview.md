---
name: project-overview
description: Speech Adventure tech stack, page structure, component map, and key conventions
metadata:
  type: project
---

Stack: Next.js 16.2.6 (Turbopack), React 19, Tailwind CSS v4, TypeScript, no database (localStorage only).

Pages: / (landing), /training (map), /training/[stage] (practice), /progress (dashboard).

Key components in src/components/speech-adventure/:
- AudioRecorder, EvaluationResultCard, PracticeCard, LevelCard, TrainingMap
- ChildProfileCard, TargetSoundSelector, LevelCompletionSummary
- RewardBadge, SessionSummaryCard, StageProgressCard, RecentAttemptsList, HeroSection

UI primitives in src/components/ui/:
- ThemeProvider (context + localStorage), ThemeToggle (sun/moon SVG button)

State: useSpeechProgress hook → speechProgressStorage (localStorage key).
Data: mockPracticeItemsBySound, mockTrainingStages, mockTargetSounds in speechAdventureMockData.ts.

**Why:** No backend/auth by design — pure prototype for demo/investor purposes.
**How to apply:** Don't suggest Supabase, auth, or real AI — keep it mock.
