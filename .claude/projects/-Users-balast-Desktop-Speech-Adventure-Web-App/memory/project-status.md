---
name: project-status
description: Current implementation status of Speech Adventure phases and completed features
metadata:
  type: project
---

Speech Adventure is a Thai children's speech therapy web app built with Next.js 16 + Tailwind CSS v4.

**Why:** Prototype for demo to investors/stakeholders. No real AI or Supabase yet.

**How to apply:** Check this before adding new features to avoid duplicating work.

## Completed phases (as of 2026-05-27):
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
- Parent/Teacher observation notes (observationStorage, useObservationNotes, /progress, /report)
- Role-based app shell and public homepage
- School admin signup, org creation, classroom management
- Classroom teacher/student assignment
- Teacher dashboard foundation (/teacher)
- Child access and permission system
- **Phase 14 (2026-05-27): CSV Student Import for School Admin**
  - Migration: 20260527000400_child_profile_school_fields.sql (adds organization_id, student_code, nickname, grade_level, parent_email_pending to child_profiles)
  - Types: src/types/schoolImport.ts
  - Service: src/lib/services/StudentImportService.ts (pure CSV parse + validate)
  - ISchoolRepository: listStudentCodes + importStudents methods
  - Supabase + Local implementations
  - Hook: src/hooks/useSchoolImport.ts (4-step state machine)
  - UI: src/components/school/StudentImportWizard.tsx (4-step modal wizard)
  - /school page: "นำเข้านักเรียน" button (school_admin only via layout guard)

## Key architecture notes:
- Supabase + localStorage (configurable via NEXT_PUBLIC_STORAGE_PROVIDER)
- State via useSyncExternalStore + repository pattern
- `useSpeechProgress()` for progress, `useSchool()` for classroom data
- RLS: org admin/owner imports; classroom teachers see student profiles via new policies
- School import: student profiles created with admin's user_id; no auto-link of parents
