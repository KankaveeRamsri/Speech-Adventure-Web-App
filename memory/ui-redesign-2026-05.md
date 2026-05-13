---
name: ui-redesign-2026-05
description: Premium UI redesign completed May 2026 — dark/light mode, design system, all pages
metadata:
  type: project
---

Full premium UI redesign implemented 2026-05-13.

**Theme system:**
- Class-based dark mode via `@custom-variant dark (&:where(.dark, .dark *))` in globals.css
- `.dark` block overrides CSS custom properties: `--color-bg`, `--color-surface`, `--color-text`, etc.
- ThemeProvider sets `dark` class on `document.documentElement` + localStorage key `speech-adventure-theme`
- FOUC prevention inline script in layout.tsx `<head>`

**Design language:**
- Border radius: `rounded-xl` (12px) for cards, `rounded-2xl` (16px) for hero/large
- Shadows: `shadow-sm` standard, `shadow-md` on hover
- Borders: `border border-border` (auto dark: #1E3050 in dark mode)
- No emoji as decorations — SVG icons inline for landing features
- Inline SVG icons instead of lucide-react (not installed)

**Color tokens (light/dark):**
- bg: #F8FAFC / #0B1829
- surface: #FFFFFF / #111E33
- text: #1E293B / #E1E8F0
- text-muted: #64748B / #7A90A8
- border: #E2E8F0 / #1E3050

**Files changed:** globals.css, layout.tsx, page.tsx, HeroSection.tsx, training/page.tsx,
training/[stage]/page.tsx, progress/page.tsx, LevelCard.tsx, TrainingMap.tsx,
ChildProfileCard.tsx, TargetSoundSelector.tsx, PracticeCard.tsx, AudioRecorder.tsx,
EvaluationResultCard.tsx, LevelCompletionSummary.tsx, RewardBadge.tsx, SessionSummaryCard.tsx,
StageProgressCard.tsx, RecentAttemptsList.tsx.
**New files:** src/components/ui/ThemeProvider.tsx, src/components/ui/ThemeToggle.tsx.

**Why:** User requested premium/demo-ready redesign with dark mode for startup presentation.
**How to apply:** Keep using CSS custom property tokens (bg-bg, bg-surface, text-text, border-border).
For dark-only overrides use `dark:` prefix classes. ThemeToggle appears in every page nav.
