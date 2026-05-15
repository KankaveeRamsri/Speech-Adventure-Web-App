---
name: project-status
description: Current implementation status of Speech Adventure phases and completed features
metadata:
  type: project
---

Speech Adventure is a Thai children's speech therapy web app built with Next.js 16 + Tailwind CSS v4.

**Why:** Prototype for demo to investors/stakeholders. No real AI or Supabase yet.

**How to apply:** Check this before adding new features to avoid duplicating work.

## Completed phases (as of 2026-05-15):
- Premium UI redesign
- Child profile onboarding (/onboarding)
- Training map (/training) with level nodes
- Multi-mission practice (/training/[stage])
- Audio recording (useAudioRecorder hook)
- Mock speech evaluation API (/api/speech/evaluate)
- Progress tracking with localStorage (speechProgressStorage.ts)
- Practice session tracking (startPracticeSession, completePracticeSession)
- Demo data mode (loadDemoProgress in speechAdventureDemoData.ts)
- Parent/teacher report page (/report)
- Phase 13: Rewards and badges system (/rewards)

## Key architecture notes:
- No Supabase, no real AI
- State via useSyncExternalStore + localStorage
- `useSpeechProgress()` is the main hook for all progress data
- Demo data covers all 7 stages with 31 attempts and 8 sessions
- Rewards system: src/types/rewards.ts, src/lib/rewards/, src/app/rewards/page.tsx
