# Current Roadmap

## Completed Phases

### Phase 1 — Core UX Shell
- Landing page, onboarding wizard, navigation layout (AppShell)
- Dark/light theme, responsive design (sidebar + mobile nav)
- Child profile creation and persistence

### Phase 2 — Training System
- 7-stage curriculum structure (pretest → levels 1–5 → review)
- Stage unlock progression, practice session lifecycle
- 6 practice item types: test, oral_motor, sound_choice, sound_production, word, sentence
- Audio recording integration (MediaRecorder)
- Mock speech evaluation (score, stars, feedback)

### Phase 3 — Progress & Reporting
- Full progress tracking (attempts, sessions, stage status)
- Progress summary (improvement delta, difficult items, session analytics)
- Progress dashboard, printable report, reward badges (10 badges)
- Detail drawers for attempts and sessions
- Observation notes for therapists/parents

### Phase 4 — Data Portability & Demo
- Local export / import / clear
- Demo mode with pre-seeded data
- Curriculum library browser (`/library`)

---

## Current Phase

### Phase 5 — Backend Integration (`feature/supabase`)
- Supabase project setup (auth, PostgreSQL, Storage)
- Repository abstraction over storage modules
- Cloud sync for progress, profile, observations
- Audio recording upload to Supabase Storage
- Local-to-cloud migration on first login

---

## Future Roadmap

### Phase 6 — Real AI Evaluation
- Implement `/api/speech/evaluate` route with a speech model
- Swap `ACTIVE_PROVIDER` from `"mock"` to `"api"`
- Score calibration with speech therapy guidelines
- Real feedback and recommendations in Thai

### Phase 7 — Multi-User / Therapist Features
- Multi-child profile switcher
- Therapist role with access to multiple children
- Therapist dashboard with comparative progress views
- Shareable report links

### Phase 8 — Engagement & Retention
- Training goal reminders (push / email)
- Streak tracking
- Additional reward mechanics (levels, collectibles)
- Parent progress digest (weekly summary)

### Phase 9 — Curriculum Expansion
- More target sounds (currently 4+)
- Curriculum editor for therapists
- Difficulty adaptation based on performance
