# Current Features

## Onboarding
- 5-step wizard: welcome → name+age → target sound → training goal → confirmation
- Edit mode: pre-fills existing profile, re-saves without clearing progress
- Redirects to pretest on first setup, training map on edit

## Training Flow
- 7 sequential stages: pretest → level-1 → level-2 → level-3 → level-4 → level-5 → review
- Stage unlock logic: complete current stage (score ≥ 70) to unlock next
- Pretest/review: any attempt counts as completed
- Stage types: test, oral_motor, sound_choice, sound_production, word, sentence
- Practice session lifecycle: start → attempts → complete/abandon

## Audio Recording
- `useAudioRecorder` hook wraps MediaRecorder API
- States: idle → requesting_permission → recording → recorded → processing → result
- Handles: permission_denied, unsupported, error states
- Recordings sent to speech evaluator (currently mock)

## Speech Evaluation
- `evaluateSpeech.ts` routes to mock or API provider
- Returns: score, confidence, status (passed/almost/retry), feedback, recommendation
- API route stub at `/api/speech/evaluate`
- `isMock: true` flag on all current results

## Progress Tracking
- Per-child, per-sound progress (attempts + sessions)
- `calculateProgressSummary()`: totalAttempts, averageScore, stars, completedStages, pretest/review scores, improvement delta, difficultItems
- Stage status per attempt history: locked / current / completed / review
- Recent attempts and sessions (last 10)

## Rewards / Badges
- 10 defined badges: first_practice, pretest_completed, level_starter, sound_explorer, word_builder, sentence_speaker, review_champion, great_improvement, consistent_learner, star_collector
- Stars earned per attempt (0–3), accumulated globally
- Rewards page with badge collection display

## Reports
- Printable report page (`/report`)
- Report components: header, metric cards, stage table, summary card
- Print-optimized CSS (bg/padding overrides)

## Curriculum Library
- `/library` — browse all practice items by sound and stage
- Filtered by: sound, stage, item type
- Shows type labels in Thai (กล้ามเนื้อปาก, เลือกเสียง, ออกเสียง, คำ, ประโยค)

## Demo Mode
- `/demo` — presentation/showcase page
- `loadDemoProgress()` injects ~N demo attempts into the progress store
- Demo data button available in onboarding data manager

## Import / Export
- Export: JSON backup with metadata (`speech-adventure-backup-YYYY-MM-DD.json`)
- Import: validates `appName` + `metadata`, merges into localStorage, triggers store refresh
- Clear: removes all data keys, preserves UI preferences (theme, sidebar state)

## Theme System
- Class-based dark mode (`.dark` on `<html>`)
- FOUC prevention via inline `<script>` in `<head>`
- CSS custom properties for all semantic colors; Tailwind picks them up automatically
- Light/dark toggle in top nav and AppTopBar

## Responsive Layout
- Desktop: collapsible sidebar (240px expanded / 72px collapsed), no top bar
- Mobile: thin top bar (44px) + bottom nav bar, no sidebar
- Breakpoint: `lg` (1024px)
- Sidebar collapsed state persisted in localStorage

## Child Profile
- Fields: id, name, age, targetSound, trainingGoal, createdAt, updatedAt
- Profile card shown on training map and profile page
- Target sound drives which curriculum content is loaded

## Observation Notes
- Therapist/parent notes linked to sessions
- CRUD via `observationStorage.ts`
- Displayed in details drawer (`SessionDetailDrawer`, `AttemptDetailDrawer`)
