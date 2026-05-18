# Tech Stack

## Current (Implemented)

| Category | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js | 16.2.6 — App Router, breaking changes vs older versions |
| UI Library | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 — CSS-first config, `@theme` in globals.css |
| CSS Processing | PostCSS + @tailwindcss/postcss | ^4 |
| Fonts | Kanit + Noto Sans Thai | Google Fonts, loaded via CSS `@import` |
| State | useSyncExternalStore | React built-in, wraps localStorage modules |
| Storage | localStorage | Browser API, no backend |
| Audio | MediaRecorder API | Browser built-in, wrapped in `useAudioRecorder` |
| Linting | ESLint | ^9, `eslint-config-next` |

## No Third-Party UI Library
- All components are hand-built with Tailwind
- SVG icons are inlined (no icon package)
- No animation library — CSS keyframes in `globals.css`

## Planned / In-Progress

| Category | Technology | Notes |
|---|---|---|
| Backend / DB | Supabase | PostgreSQL + Auth + Storage — `feature/supabase` branch |
| AI Evaluation | TBD (LLM / Speech API) | Slot in `evaluateSpeech.ts`, route at `/api/speech/evaluate` |
| Audio Storage | Supabase Storage | For persisting recording blobs |
| Authentication | Supabase Auth | Email/magic link for parents and therapists |

## Key File References
- Tailwind theme: `src/app/globals.css` (`@theme inline { ... }`)
- Next.js config: `next.config.ts`
- TypeScript config: `tsconfig.json`
- Path alias: `@/` → `src/` (configured in tsconfig)
