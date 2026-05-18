# File Structure

```
src/
├── app/
│   ├── layout.tsx                    # RootLayout + ThemeProvider + FOUC prevention
│   ├── page.tsx                      # Landing page (standalone, no AppShell)
│   ├── globals.css                   # Tailwind v4 theme tokens + dark mode vars
│   ├── onboarding/page.tsx           # 5-step child profile setup wizard
│   ├── training/
│   │   ├── page.tsx                  # Training map (AppShell)
│   │   └── [stage]/page.tsx          # Stage practice session
│   ├── progress/page.tsx             # Progress dashboard
│   ├── report/page.tsx               # Printable progress report
│   ├── rewards/page.tsx              # Badges / reward collection
│   ├── library/page.tsx              # Curriculum content browser
│   ├── demo/page.tsx                 # Demo mode / presentation
│   ├── profile/page.tsx              # Child profile view
│   └── api/speech/evaluate/route.ts  # AI evaluation API stub
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Root layout wrapper (sidebar + topbar + mobnav)
│   │   ├── AppSidebar.tsx            # Collapsible desktop sidebar
│   │   ├── AppTopBar.tsx             # Thin mobile top bar
│   │   ├── MobileNav.tsx             # Mobile bottom nav bar
│   │   ├── SidebarContext.tsx        # Sidebar collapsed state + localStorage sync
│   │   └── NavIcon.tsx               # SVG icon helper for nav
│   ├── speech-adventure/
│   │   ├── AudioRecorder.tsx         # Mic recording UI + useAudioRecorder
│   │   ├── TrainingMap.tsx           # Stage grid / map display
│   │   ├── PracticeCard.tsx          # Single practice item card
│   │   ├── EvaluationResultCard.tsx  # Score + feedback after attempt
│   │   ├── ChildProfileCard.tsx      # Profile summary widget
│   │   ├── LevelCard.tsx             # Stage card for map
│   │   ├── ProgressSummary.tsx       # Stats overview widget
│   │   ├── RecentAttemptsList.tsx    # Last N attempts list
│   │   ├── RewardBadge.tsx           # Badge display component
│   │   ├── TargetSoundSelector.tsx   # Sound picker dropdown
│   │   ├── StageProgressCard.tsx     # Per-stage stars/status
│   │   ├── SessionSummaryCard.tsx    # End-of-session summary
│   │   ├── PracticeSessionSummary.tsx
│   │   ├── LevelCompletionSummary.tsx
│   │   └── HeroSection.tsx           # Landing hero
│   ├── report/                       # Report-specific sub-components
│   ├── details/                      # Drawer detail panels (attempt, session)
│   ├── observations/                 # Observation note cards + form
│   ├── landing/LandingCTA.tsx
│   └── ui/
│       ├── ThemeProvider.tsx         # Dark/light context
│       └── ThemeToggle.tsx           # Toggle button
│
├── hooks/
│   ├── useSpeechProgress.ts          # useSyncExternalStore over progressStorage
│   ├── useChildProfile.ts            # useSyncExternalStore over profileStorage
│   ├── useAudioRecorder.ts           # MediaRecorder wrapper
│   └── useObservationNotes.ts        # useSyncExternalStore over observationStorage
│
├── lib/
│   ├── speechProgressStorage.ts      # Progress store (attempts, sessions, stage logic)
│   ├── child-profile/childProfileStorage.ts
│   ├── observations/observationStorage.ts
│   ├── local-data/localDataBackup.ts # Export / import / clear
│   ├── demo/speechAdventureDemoData.ts
│   ├── rewards/
│   │   ├── rewardDefinitions.ts      # Badge definitions (10 badges)
│   │   └── calculateRewards.ts
│   └── speech-evaluation/
│       ├── evaluateSpeech.ts         # Provider router (mock | api)
│       ├── mockEvaluator.ts
│       ├── client.ts
│       └── types.ts
│
├── data/
│   └── speechAdventureMockData.ts    # Static curriculum content
│
└── types/
    ├── speechAdventure.ts            # Core domain types
    ├── observations.ts
    └── rewards.ts
```
