# Project Status

## Current Phase
**Prototype v1.0** — Full UI/UX shell complete, all features wired to mock data and localStorage. Real AI evaluation and backend are the next layer.

## Completed Systems
- [x] Landing page with feature overview and journey steps
- [x] 5-step onboarding wizard with profile persistence
- [x] Training map with 7-stage unlock progression
- [x] Per-stage practice sessions (all 6 item types)
- [x] Audio recording with MediaRecorder API
- [x] Mock speech evaluation (score, stars, feedback)
- [x] Full progress tracking (attempts, sessions, stage status)
- [x] Progress summary calculation (pretest vs review improvement, difficult items)
- [x] Reward system with 10 badges
- [x] Progress dashboard page
- [x] Printable report page
- [x] Curriculum library browser
- [x] Demo mode with pre-seeded data
- [x] Local data export / import / clear
- [x] Observation notes (therapist/parent)
- [x] Dark / light theme with FOUC prevention
- [x] Responsive layout (AppShell: sidebar + mobile nav)
- [x] Detail drawers (attempt, session)

## Architecture Maturity
- Storage layer: **stable** — pub-sub pattern prevents hydration loops
- UI layer: **stable** — component boundaries are clean
- AI evaluation: **stub only** — `evaluateSpeech.ts` routes to mock
- Backend: **none** — `feature/supabase` branch suggests active work

## Next Recommended Phases
1. **Real AI integration** — swap `ACTIVE_PROVIDER` from `"mock"` to `"api"`, implement `/api/speech/evaluate` route with a speech-to-text + scoring model
2. **Supabase backend** — auth, cloud sync, audio storage (per `database-plan.md`)
3. **Multi-child support** — profile switcher, per-child progress isolation
4. **Therapist dashboard** — separate role with access to multiple children
5. **Notification / reminder system** — training goal reminder (daily/3x-week)
