---
name: speech-adventure-ui
description: UX/UI design system and guidelines for the Speech Adventure web app. Auto-apply when designing, building, or reviewing any UI for this project.
triggers:
  - design
  - ui
  - ux
  - layout
  - component
  - page
  - screen
  - interface
  - style
  - color
  - animation
  - accessibility
  - refactor
  - improve
---

# Speech Adventure — UX/UI Design Skill

> Apply this skill automatically whenever the user asks to design, build, improve, refactor, or review any UI/UX for the Speech Adventure project.

---

## 1. Project Identity

**Product:** Speech Adventure — a web-based speech training prototype for Thai-speaking children.

**Audience:**
- Primary: Children (approximately 4–10 years old) practicing speech exercises.
- Secondary: Parents, therapists, teachers monitoring progress.
- Tertiary: Investors / stakeholders viewing the prototype as a product demo.

**Tone:** Playful, warm, encouraging, safe — like a friendly coach. Clean and structured enough to present professionally.

**Language:** Thai is the primary content language. UI labels, instructions, and feedback copy should be in Thai. English may appear in technical/meta UI (e.g., settings, developer info).

---

## 2. Design Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Child-First** | Every design decision starts from the child's perspective. Large tap targets, simple navigation, minimal text, visual cues. |
| 2 | **Encouraging Always** | Never show harsh failure states. Use soft redirection ("Try again!", "Almost there!"). Celebrate every small win. |
| 3 | **Calm Focus** | One task at a time per screen. Remove visual noise. Guide attention to the current activity. |
| 4 | **Consistent & Predictable** | Reuse the same layout patterns, button styles, and interaction flows across all levels. Children learn the interface once. |
| 5 | **Professional-Ready** | The UI must look polished in a demo/presentation context. No placeholder aesthetics, no "toy" appearance that undermines credibility. |
| 6 | **Accessible by Default** | Support screen readers, keyboard navigation, high contrast, and reduced-motion preferences from the start. |
| 7 | **Mobile-First Responsive** | Primary target is tablet (iPad landscape/portrait). Desktop is for presentation. Phone is a secondary consideration but must not break. |

---

## 3. Color Direction

### 3.1 Primary Palette

| Role | Color | Usage |
|------|-------|-------|
| **Primary** | `#6C63FF` (Soft Violet) | Main CTAs, active states, progress indicators, primary buttons |
| **Secondary** | `#FFB347` (Warm Orange) | Rewards, stars, achievements, highlights |
| **Success** | `#4CAF82` (Fresh Green) | Correct answers, completion states, positive feedback |
| **Background** | `#FAFAFE` (Near White) | Page background, card surfaces |
| **Surface** | `#FFFFFF` (White) | Cards, modals, popovers |

### 3.2 Semantic Palette

| Role | Color | Usage |
|------|-------|-------|
| **Error / Try Again** | `#FF6B6B` (Soft Red) | Incorrect answer feedback — always pair with encouraging text |
| **Info / Hint** | `#5BC0EB` (Sky Blue) | Hints, tips, coach guidance |
| **Neutral Text** | `#2D3436` (Charcoal) | Body text, labels |
| **Muted Text** | `#636E72` (Gray) | Secondary text, timestamps |
| **Disabled** | `#B2BEC3` (Light Gray) | Disabled buttons, locked levels |

### 3.3 Level Theme Accents

Each level may have a subtle theme color to differentiate stages while keeping the overall palette cohesive:

| Level | Accent | Example Usage |
|-------|--------|---------------|
| Pretest | `#A29BFE` (Lavender) | Header accent, progress bar |
| Level 1: Oral Motor | `#FD79A8` (Petal Pink) | Activity borders, icon tint |
| Level 2: Sound Familiarity | `#00CEC9` (Teal) | Activity borders, icon tint |
| Level 3: Sound Production | `#FDCB6E` (Honey Gold) | Activity borders, icon tint |
| Level 4: Word Practice | `#E17055` (Coral) | Activity borders, icon tint |
| Level 5: Sentence Practice | `#6C5CE7` (Iris Purple) | Activity borders, icon tint |
| Post-test | `#A29BFE` (Lavender) | Header accent, progress bar |

### 3.4 Color Rules

- Never use more than 2 accent colors on a single screen.
- Background must always be light (`#FAFAFE` or `#FFFFFF`).
- Text on colored backgrounds must meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text).
- Use opacity variants (`opacity: 0.08`, `0.16`, `0.24`) of accent colors for subtle backgrounds and hover states.

---

## 4. Typography

### 4.1 Font Stack

- **Thai + Latin:** `Noto Sans Thai`, `Prompt`, or `Kanit` — pick one and use consistently throughout the project. These fonts render Thai clearly and have playful but readable letterforms.
- **Monospace (if needed):** `JetBrains Mono` or `Fira Code` for any developer/technical display.

### 4.2 Type Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `display` | `2.5rem` (40px) | 700 | Level titles, celebration headings |
| `h1` | `2rem` (32px) | 700 | Page titles |
| `h2` | `1.5rem` (24px) | 600 | Section headings, activity names |
| `h3` | `1.25rem` (20px) | 600 | Card titles, sub-sections |
| `body` | `1rem` (16px) | 400 | Body text, instructions |
| `body-lg` | `1.125rem` (18px) | 400 | Emphasized instructions, feedback messages |
| `caption` | `0.875rem` (14px) | 400 | Labels, timestamps, hints |
| `button` | `1rem` (16px) | 600 | Button text |
| `button-sm` | `0.875rem` (14px) | 600 | Small / secondary buttons |

### 4.3 Typography Rules

- Line height: `1.5` for body, `1.2` for headings.
- Never use ALL CAPS for Thai text.
- Limit to 2 font weights per screen (e.g., 400 + 600 or 400 + 700).
- Minimum text size: `14px`. Never go smaller.

---

## 5. Layout System

### 5.1 Grid & Spacing

- **Base unit:** `4px`. All spacing values must be multiples of 4.
- **Common spacing tokens:**
  - `4px` — tight (icon gaps)
  - `8px` — compact (within-component)
  - `12px` — comfortable (between related elements)
  - `16px` — standard (padding within cards)
  - `24px` — section gap
  - `32px` — major section gap
  - `48px` — page-level vertical rhythm

- **Max content width:** `960px` centered. Wider screens get horizontal margin.
- **Content padding (mobile):** `16px` on each side.
- **Content padding (tablet/desktop):** `24px` on each side.

### 5.2 Page Shell

Every screen follows this structure:

```
┌─────────────────────────────────────────┐
│  [Top Bar]  ← Back | Level Title | Menu │  ← Fixed, 56px height
├─────────────────────────────────────────┤
│                                         │
│  [Progress Bar]                         │  ← Thin (6px), shows step within level
│                                         │
│                                         │
│           [Main Content Area]           │  ← Scrollable if needed
│           (centered, max-width 960px)   │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  [Bottom Bar]  ← Primary CTA button     │  ← Fixed, 72px height
└─────────────────────────────────────────┘
```

### 5.3 Layout Variants

| Pattern | When to Use |
|---------|-------------|
| **Centered Card** | Single-choice activities, pretest questions, congratulations screens |
| **Split Layout** | Instruction on left, activity on right (desktop/tablet landscape) |
| **Full-Width Activity** | Oral motor exercises, sound production with microphone |
| **Grid of Cards** | Level selection, sound selection in Level 2 |
| **Stepped Flow** | Multi-step exercises within a level (show progress dots) |

### 5.4 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `sm` | `≤ 640px` | Phone — stack everything vertically |
| `md` | `641–768px` | Tablet portrait — single column, larger touch targets |
| `lg` | `769–1024px` | Tablet landscape — split layouts become available |
| `xl` | `≥ 1025px` | Desktop — full layout, hover effects enabled |

---

## 6. Components

### 6.1 Buttons

| Variant | Appearance | When to Use |
|---------|------------|-------------|
| **Primary** | Filled `#6C63FF`, white text, `border-radius: 16px`, `padding: 12px 32px`, subtle shadow | Main CTA (Start, Next, Submit) |
| **Secondary** | Outlined `#6C63FF` border, violet text, same shape | Alternative actions (Skip, Back) |
| **Icon Button** | Circle or rounded square `48x48px`, icon centered | Audio play, microphone, settings |
| **Ghost** | No border, text only, violet color | Tertiary actions, links within text |
| **Reward** | Filled `#FFB347`, white text, larger size, optional confetti | Claim reward, celebrate |

**Button Rules:**
- Minimum tap target: `48x48px`.
- Active/pressed state: scale `0.96` with `transform-origin: center`.
- Disabled state: `opacity: 0.5`, `cursor: not-allowed`, no hover effects.
- Always add a brief `transition: all 150ms ease` for state changes.

### 6.2 Cards

```
┌─────────────────────────────┐
│  [Icon or Illustration]      │  ← 120x120px max, centered
│                              │
│  Title Text                  │  ← h3 or h2
│  Supporting description      │  ← body or caption
│                              │
│  ┌─────────────────────┐    │
│  │  Action Button      │    │  ← Optional
│  └─────────────────────┘    │
└─────────────────────────────┘

Style: border-radius: 20px, background: #FFFFFF,
       box-shadow: 0 2px 12px rgba(0,0,0,0.06),
       padding: 24px
Hover: box-shadow: 0 4px 20px rgba(0,0,0,0.10), translateY(-2px)
```

### 6.3 Progress Indicators

| Type | Usage |
|------|-------|
| **Linear Progress Bar** | Top of page — shows overall level progress (e.g., "Step 3 of 8") |
| **Step Dots** | Within a mini-exercise — horizontal row of dots, filled = complete |
| **Circular Progress** | Post-test score display, accuracy ring |
| **Star Counter** | Top-right corner — earned stars with count badge |

### 6.4 Feedback Components

| Component | When to Use |
|-----------|-------------|
| **Success Toast** | Correct answer — green banner with check icon, auto-dismiss 2s |
| **Try-Again Banner** | Incorrect answer — soft red banner with encouraging text, auto-dismiss 3s |
| **Coach Bubble** | In-context hint or instruction — speech-bubble shape with mascot/coach icon |
| **Celebration Overlay** | Level complete — full-screen overlay with confetti/stars animation, reward summary |
| **Micro-feedback** | Small visual/audio acknowledgment for button taps, correct choices |

### 6.5 Audio/Microphone

- **Play Button:** Circle with play icon, pulses gently while audio plays.
- **Microphone Button:** Circle with mic icon, glows/pulses when recording, shows waveform visualization.
- **Playback:** After recording, show a small waveform with play button for self-review.

### 6.6 Level Map / Navigation

- Visual level map (not just a list) showing connected nodes.
- Locked levels shown as grayed-out with lock icon.
- Completed levels show a checkmark or star.
- Current level is highlighted with the level's accent color and subtle pulse.
- Paths between levels shown as dotted or solid lines.

---

## 7. Interaction Patterns

### 7.1 Core Loop

```
Start Activity → Attempt → Feedback → (Repeat or Advance) → Reward Summary
```

Every activity within a level follows this loop. Never skip the feedback step.

### 7.2 Navigation

- **Back:** Always available (top-left). Returns to previous screen. On the first step of a level, returns to level map.
- **Next:** Primary CTA. Disabled until the child has made an attempt.
- **Skip:** Available only for non-critical activities. Uses secondary button style.
- **Never trap the user.** There is always a way forward or back.

### 7.3 State Transitions

- **Entering a level:** Brief animated transition (0.3s fade + slide) showing level name and icon.
- **Between steps within a level:** Smooth cross-fade (0.2s). Avoid jarring jumps.
- **Correct answer:** Scale-up pulse on the correct element (0.3s), green flash, success sound.
- **Incorrect answer:** Gentle shake (0.4s), soft red flash, encouraging message. Never mock or discourage.
- **Level complete:** Celebration overlay with confetti, stars, reward reveal, "Continue" button.

### 7.4 Micro-Interactions

| Trigger | Response |
|---------|----------|
| Button hover (desktop) | Subtle lift (`translateY(-1px)`) + shadow increase |
| Button press | Scale down (`scale(0.96)`) |
| Card hover (desktop) | Lift + shadow increase |
| Audio playing | Pulsing ring around play button |
| Recording | Glowing ring around mic button + waveform |
| Star earned | Star icon flies from source to star counter in top-right |
| Level unlocked | Unlock animation (scale up from 0 + sparkle) |

---

## 8. Animation & Motion

### 8.1 Motion Principles

- **Purposeful:** Every animation communicates something (state change, reward, guidance).
- **Brief:** Keep animations under 500ms. Most should be 150–300ms.
- **Easing:** Use `ease-out` for entrances, `ease-in` for exits, `cubic-bezier(0.34, 1.56, 0.64, 1)` for playful bounces.
- **Reduced motion:** Respect `prefers-reduced-motion`. Replace animations with simple opacity fades.

### 8.2 Animation Library

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fadeIn` | 200ms | ease-out | General appearance |
| `fadeOut` | 150ms | ease-in | General disappearance |
| `slideUp` | 300ms | ease-out | Toast notifications, bottom sheets |
| `slideDown` | 200ms | ease-in | Dismiss bottom sheets |
| `scaleIn` | 200ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Modals, celebration elements |
| `pulse` | 600ms | ease-in-out, loop | Active recording, waiting states |
| `shake` | 400ms | ease-in-out | Incorrect answer feedback |
| `confetti` | 1500ms | ease-out | Level complete celebration |
| `flyToCounter` | 600ms | ease-in-out | Star flies to counter |
| `bounceIn` | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reward badges, achievement unlocks |

### 8.3 Celebration & Reward Animations

- **Stars:** Golden star with sparkle particles, flies to counter.
- **Confetti:** Light confetti burst (not overwhelming). Duration: 1.5s, then fade out.
- **Badge unlock:** Scale from 0 to 1 with bounce easing + brief sparkle.
- **Level complete:** Full-screen overlay with celebration, shows:
  - "Great job!" heading
  - Stars earned
  - New badge (if applicable)
  - "Continue" button

---

## 9. Accessibility

### 9.1 Requirements

- All interactive elements must be keyboard-reachable (`Tab` / `Shift+Tab`).
- Focus rings must be visible (custom `outline` using primary color, `2px solid`, `offset 2px`).
- All images and icons must have `alt` text or `aria-label`.
- Color is never the only indicator of state — always pair with text or icon.
- Audio content must have a text alternative (captions or transcript toggle).
- Video/animation content must be pausable.
- Touch targets: minimum `44x44px` (WCAG 2.5.5).

### 9.2 Screen Reader Considerations

- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`, `<header>`, `<footer>`).
- Use `aria-live="polite"` for dynamic feedback (score updates, toasts).
- Use `aria-live="assertive"` for error alerts.
- Announce level transitions with `aria-live`.
- Provide `role` and `aria-label` for custom interactive elements (drag-and-drop, audio players).

### 9.3 Contrast & Readability

- Minimum contrast ratio: 4.5:1 for text, 3:1 for large text and UI components.
- Test all color combinations against WCAG AA.
- Avoid placing text over images without a solid or gradient overlay.
- Font size minimum: `14px`. Instructional text should be `16px` or larger.

---

## 10. Illustration & Imagery

### 10.1 Style

- **Flat or soft 3D** illustrations — no photorealism.
- Rounded shapes, friendly proportions, warm colors.
- If a mascot character is used, it should be simple, consistent, and appear across the app as a coach/guide.
- Icons should use the project's color palette (violet primary, with level accents).

### 10.2 Image Guidelines

- Use SVG for icons and illustrations (scalable, small file size).
- Use WebP for photos/raster images, with PNG fallback.
- All images should have descriptive `alt` text in Thai.
- Avoid decorative images that don't serve a purpose. Every image should help the child understand what to do.

---

## 11. Sound Design (UI Context)

> Note: This section guides the visual representation of audio states, not the actual sound files.

| Context | Visual Cue |
|---------|------------|
| Instruction audio | Animated speaker icon or coach bubble with sound waves |
| Playback | Pulsing play button, progress bar advancing |
| Recording | Glowing mic, real-time waveform |
| Correct sound | Green flash + checkmark |
| Incorrect sound | Gentle shake + "try again" text |
| Reward sound | Star animation + confetti |
| Background music toggle | Icon button in top-right or settings |

---

## 12. Component Naming Convention

When building React components (or equivalent), follow this naming structure:

```
src/
  components/
    ui/                  ← Shared primitives
      Button.tsx
      Card.tsx
      ProgressBar.tsx
      StepDots.tsx
      IconButton.tsx
      Toast.tsx
      Modal.tsx
      CoachBubble.tsx
      StarCounter.tsx
      AudioPlayer.tsx
      MicButton.tsx
    layout/              ← Page structure
      PageShell.tsx
      TopBar.tsx
      BottomBar.tsx
    features/            ← Feature-specific
      level-map/
        LevelMap.tsx
        LevelNode.tsx
      pretest/
        PretestQuestion.tsx
      oral-motor/
        BlowExercise.tsx
        RhythmExercise.tsx
      sound-familiarity/
        SoundCard.tsx
        ListenAndChoose.tsx
      sound-production/
        PronunciationExercise.tsx
        MockEvaluation.tsx
      word-practice/
        WordCard.tsx
      sentence-practice/
        SentenceCard.tsx
      rewards/
        CelebrationOverlay.tsx
        BadgeUnlock.tsx
```

---

## 13. Design Tokens (CSS Custom Properties)

When setting up styles, define these tokens as CSS custom properties or a theme object:

```css
:root {
  /* Colors */
  --color-primary: #6C63FF;
  --color-secondary: #FFB347;
  --color-success: #4CAF82;
  --color-error: #FF6B6B;
  --color-info: #5BC0EB;
  --color-bg: #FAFAFE;
  --color-surface: #FFFFFF;
  --color-text: #2D3436;
  --color-text-muted: #636E72;
  --color-disabled: #B2BEC3;

  /* Typography */
  --font-family: 'Kanit', 'Noto Sans Thai', sans-serif;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.10);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}
```

---

## 14. UI Patterns by Level

### Pretest / Post-test
- One question per screen.
- Large text prompt, 2–4 answer options as tappable cards.
- Progress dots at the top (no percentage — avoid pressure).
- No time limit. No skip button.
- Post-test: show comparison with pretest score using a friendly visual (e.g., "before/after" growth chart).

### Level 1: Oral Motor
- **Blow exercise:** Full-screen visual prompt (animated mouth shape), timer ring showing duration, visual "wind" effect on completion.
- **Rhythm exercise:** Visual metronome or bouncing indicator, child taps along.
- **Mouth imitation:** Side-by-side (or overlay) model mouth + mirror/camera area.
- Reward summary at end with stars earned.

### Level 2: Sound Familiarity
- Grid of sound cards (2x2 on mobile, 3x3 on tablet).
- Audio plays automatically or on tap. Child selects matching card.
- Visual feedback on selection (green border = correct, red border = try again).
- Coach bubble for hints if needed.

### Level 3: Sound Production
- Large target consonant display (e.g., "ก").
- Audio model plays first, then mic button activates.
- After recording: playback for self-review + "Submit" button.
- Mock evaluation result shown as a friendly score (e.g., 3/5 stars with "Good try!" text).
- Option to retry.

### Level 4: Word Practice
- Word card with Thai word, image, and audio.
- Child listens, then records.
- Mock evaluation with score.
- Progress through 5–10 words per session.

### Level 5: Sentence Practice
- Sentence displayed with target consonant highlighted.
- Audio model available.
- Recording + mock evaluation.
- Progress through 3–5 sentences per session.

---

## 15. Quality Checklist

Before marking any UI work as complete, verify:

- [ ] All text is in Thai (unless explicitly English).
- [ ] Touch targets are at least 48x48px.
- [ ] Colors meet WCAG AA contrast requirements.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] Interactive elements have visible focus indicators.
- [ ] `alt` text or `aria-label` on all non-decorative images.
- [ ] No harsh failure states — all errors use encouraging language.
- [ ] Layout works on tablet portrait (768px) and desktop (1280px).
- [ ] Design tokens (CSS variables or theme object) are used instead of hardcoded values.
- [ ] Component naming follows the convention in Section 12.
- [ ] One primary action per screen (don't overwhelm the child).
- [ ] Loading states are handled (skeleton screens or friendly spinner).

---

## 16. Technology Notes

- **Framework:** React (or Next.js if SSR is needed). Component-based architecture.
- **Styling:** Tailwind CSS with custom theme tokens mapped from Section 13, OR CSS Modules with the design tokens. Pick one approach and stay consistent.
- **Animation:** CSS transitions for simple effects. `framer-motion` for complex sequences (celebrations, page transitions).
- **Icons:** `lucide-react` or `heroicons` for base icons. Custom SVGs for mascot and level-specific illustrations.
- **Audio:** Web Audio API for recording/playback. Visualize waveforms with `<canvas>` or a lightweight library.
- **State management:** React Context for session/progress state. No heavy state library needed for the prototype.

---

*This skill is a living document. Update it as the project evolves.*
