---
name: project-overview
description: Speech Adventure tech stack, page/route structure, component map, roles, and key conventions — updated 2026-05-29
metadata:
  type: project
---

## Stack

- Next.js (Turbopack), React 19, Tailwind CSS v4, TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- OpenAI API (speech evaluation + TTS) — server-side only

## Roles

| Role | Status | Notes |
|---|---|---|
| `parent` | **Active** | Default role. Anonymous users also get parent flow. |
| `teacher` | Foundation | Dashboard at `/teacher`, no full features yet |
| `school_admin` | Foundation | School management at `/school`, CSV import, classroom |
| `therapist` | **Disabled / coming soon** | Defined in types, no UI routes |

Role stored in Supabase `user_metadata.role`. Default = `"parent"`.

## App Routes

```
/                       Public landing
/auth/signin            Sign in
/auth/signup            Sign up (role selection: parent / teacher / school_admin)
/sign-in  /sign-up      Redirect aliases
/onboarding             Child profile setup wizard (5 steps)
/training               Training map (stage overview)
/training/[stage]       Practice session for a stage
/progress               Progress dashboard (per targetSound, attempt history)
/report                 AI-generated progress report
/profile                Profile management
/settings               App settings + cloud sync
/rewards                Reward badges
/library                Sound library
/demo                   Demo/presentation mode
/invite/[token]         Invitation accept page
/invite/accept          Invitation landing
/school                 School admin management (foundation)
/teacher                Teacher dashboard (foundation)
/api/speech/evaluate    POST — AI speech evaluation
/api/audio/sample       GET — AI TTS sample audio
```

## Parent Training Flow

7 stages in order:

| Stage | stageId | Type |
|---|---|---|
| Pre-test | `pretest` | Recording |
| Level 1 | `level-1` | Oral Motor (no recording) |
| Level 2 | `level-2` | Sound Familiarity (sound_choice) |
| Level 3 | `level-3` | Sound Production (recording) |
| Level 4 | `level-4` | Word Practice (recording) |
| Level 5 | `level-5` | Sentence Practice (recording) |
| Review / Post-test | `review` | Recording |

Target sounds: **ก / ค / ต / ช**

## Key Components

```
src/components/
├── speech-adventure/   PracticeCard, TrainingMap, LevelCard, AudioRecorder,
│                       EvaluationResultCard, ChildProfileCard, TargetSoundSelector,
│                       RecentAttemptsList, StageProgressCard, SessionSummaryCard,
│                       SampleAudioButton, LevelCompletionSummary, RewardBadge,
│                       PracticeSessionSummary, ProgressSummary, HeroSection
├── details/            AttemptDetailDrawer, SessionDetailDrawer,
│                       AttemptAudioPlayer, DetailMetricCard, LinkedObservationNotes
├── layout/             AppShell, AppSidebar, AppTopBar, ChildSelector, MobileNav,
│                       NavIcon, SidebarContext, InviteSection, AddChildModal
├── auth/               Auth guards, role gates
├── school/             School admin UI
├── teacher/            Teacher UI
├── observations/       Observation notes UI
├── sync/               CloudSyncPreview, conflict UI
└── ui/                 ThemeProvider, ThemeToggle, PermissionBanner, ...
```

## Key Hooks

| Hook | Source |
|---|---|
| `useSpeechProgress` | Progress data, stage status, session management |
| `useChildProfile` | Profile, multi-child list, selectedChildId |
| `useAuth` | Auth user, isLoading, signIn/signOut |
| `useCurrentChildAccess` | Permission gate (owned vs shared child) |
| `useObservationNotes` | CRUD for observation notes |
| `useSyncPlanPreview` | Conflict detection for cloud sync |
| `useChildAccess` | Shared-child access data |
| `useInvitations` | Parent invitation flow |
| `useSchool` | School admin data |

## State / Data

- Progress: `useSpeechProgress` → `IProgressRepository` → localStorage or Supabase
- Profile: `useChildProfile` → `IProfileRepository` → localStorage or Supabase
- Selected child: `childProfileListStorage` (user-scoped localStorage)
- Mock content: `src/data/speechAdventureMockData.ts`

## Theme System

- Class-based dark mode via `.dark` class on `<html>`
- CSS custom properties: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`
- ThemeProvider sets class + `localStorage` key `speech-adventure-theme`
- FOUC prevention inline script in `layout.tsx <head>`
- Use `bg-bg`, `bg-surface`, `text-text`, `border-border` tokens; dark overrides via `dark:` prefix

## Key Conventions

- **Never call `*Storage` modules directly from pages** — always use repository via hook
- `useChildProfile().saveProfile(profile)` is the correct write path for child profiles
- OpenAI API key is server-side only (`OPENAI_API_KEY`, no `NEXT_PUBLIC_` prefix)
- `SPEECH_EVALUATION_PROVIDER=openai` (server env) to enable real AI evaluation
- `SAMPLE_AUDIO_PROVIDER=openai` (server env) to enable real TTS
- `NEXT_PUBLIC_STORAGE_PROVIDER=local|supabase|hybrid` (client env)
