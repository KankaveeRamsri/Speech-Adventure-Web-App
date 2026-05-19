# Backend Architecture

## Current State: localStorage Only

Speech Adventure ยังไม่มี backend จริง ข้อมูลทั้งหมดอยู่ใน browser localStorage 4 key:

| localStorage Key | Domain | Size Limit Risk |
|---|---|---|
| `speech-adventure-progress-v1` | attempts + sessions | สูง (grows unbounded) |
| `speech-adventure-profile-v1` | child profile | ต่ำ |
| `speech-adventure-observations-v1` | therapist notes | ปานกลาง |
| `speech-adventure-selected-sound-v1` | UI preference | ต่ำมาก |

**ข้อจำกัดหลักของ localStorage:**
- ไม่รองรับหลายอุปกรณ์ / multi-user
- 5–10 MB limit ต่อ origin — attempts สะสมโตเรื่อยๆ
- ไม่มี auth — ใครก็ clear ได้
- ไม่รองรับ therapist dashboard หรือ analytics กลาง

---

## Proposed Backend: Supabase (Modular Monolith)

### Decision: Modular Monolith First

เลือก Modular Monolith ก่อน Microservices เพราะ:
- ทีมเล็ก, product ยังอยู่ช่วง validation
- Next.js API Routes รองรับ modular structure ได้ดี
- Supabase Edge Functions เป็น escape hatch ถ้าต้องการ isolate ในอนาคต
- ง่ายต่อการ extract boundary ออกเมื่อ traffic / complexity เพิ่ม

### Service Boundaries (เตรียมไว้แต่ยังไม่แยก)

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App                          │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Identity   │  │   Progress   │  │ Observations │  │
│  │   (Supabase  │  │   Service    │  │   Service    │  │
│  │    Auth)     │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Speech     │  │    Audio     │  │  Analytics   │  │
│  │  Evaluation  │  │  Processing  │  │   Service    │  │
│  │  (stub→AI)   │  │  (future)    │  │  (future)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
              │
     Supabase PostgreSQL + Storage + Auth
```

### Future Microservice-Ready Boundaries

แต่ละ boundary ด้านล่างสามารถ extract เป็น standalone service ได้เมื่อถึงเวลา:

| Boundary | เหตุผลที่ extract | Trigger |
|---|---|---|
| **Speech Evaluation** | ต้องการ GPU / ML infra แยก, latency SLA ต่างกัน | เมื่อใช้ real AI model |
| **Audio Processing** | storage-intensive, อาจต้อง transcode/compress | เมื่อ store audio จริง |
| **ML Inference** | ต้องการ model versioning, A/B testing | เมื่อ train custom Thai phoneme model |
| **Analytics** | read-heavy, aggregation queries, BI tools | เมื่อ therapist dashboard ซับซ้อน |

### API Route Structure (Next.js)

```
app/api/
├── auth/                    # Supabase Auth callbacks
├── speech/
│   └── evaluate/route.ts    # ← มีอยู่แล้ว (stub)
├── progress/
│   ├── route.ts             # GET/POST attempts+sessions
│   └── [childId]/route.ts   # GET child progress
├── profiles/
│   └── route.ts             # GET/PUT child profile
└── observations/
    └── route.ts             # CRUD observation notes
```

### Data Access Pattern

```
React Component
    │
    ▼
Hook (useSpeechProgress, useChildProfile, ...)
    │  useSyncExternalStore
    ▼
Repository Interface (IProgressRepository)
    │
    ├── LocalStorageProgressRepository   ← ปัจจุบัน
    └── SupabaseProgressRepository       ← เป้าหมาย
```

---

## Speech Evaluation Architecture

```
AudioRecorder (Blob)
    │
    ▼
evaluateSpeech(input: SpeechEvaluationInput)
    │
    ├── ACTIVE_PROVIDER = "mock"  → mockEvaluator.ts (ปัจจุบัน)
    └── ACTIVE_PROVIDER = "api"   → POST /api/speech/evaluate
                                      │
                                      ├── Thai ASR (e.g. NECTEC, Whisper-TH)
                                      ├── Phoneme alignment
                                      └── Scoring engine
```

**ไม่ต้องเปลี่ยน interface** เมื่อ swap provider — `SpeechEvaluationResult` คงเดิม

---

## Non-Functional Requirements

| Concern | Target |
|---|---|
| Auth | Supabase Auth (email/magic link หรือ Google OAuth) |
| Multi-device sync | Real-time via Supabase Realtime |
| Offline support | ค้าง localStorage + sync เมื่อกลับมา online |
| Data privacy | RLS บังคับ per-child isolation (ดู `rls-strategy.md`) |
| Audio storage | Supabase Storage bucket `audio-recordings/` |
| Backup/export | ยังคง JSON export ได้ (therapist requirement) |
