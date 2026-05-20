# Auth End-to-End Test Checklist

## Purpose

Manual test checklist for verifying the full Supabase Auth flow in Speech Adventure.
Run this checklist after setting real Supabase credentials in `.env.local`.

**Scope:** sign-up → email confirmation → sign-in → session restore → sign-out → settings preview  
**Out of scope:** data migration, cloud sync (upload button remains disabled)

---

## Prerequisites

### 1. Supabase Project

- Create a project at <https://app.supabase.com>
- In **Authentication → Providers**, ensure **Email** is enabled
- Note whether **Confirm email** is ON or OFF (affects test step 3)

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_STORAGE_PROVIDER=local          # keep local — do NOT change to supabase yet
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Important:** Keep `NEXT_PUBLIC_STORAGE_PROVIDER=local`.
> Auth works independently of the storage provider.
> Changing to `supabase` would activate Supabase repositories which are not ready yet.

### 3. Restart Dev Server

```bash
npm run dev
```

Verify the app loads at `http://localhost:3000`.

---

## Environment Verification

Before running tests, confirm the correct env vars are loaded:

| Check | Expected |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` is set to a real project URL | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set to the anon/public key (not service key) | ✓ |
| `NEXT_PUBLIC_STORAGE_PROVIDER` is `local` | ✓ |
| `.env.local` does NOT appear in `git status` output | ✓ |
| `git check-ignore .env.local` reports it is ignored | ✓ |

---

## Test Cases

---

### TC-01 · Sign-up new account

**URL:** `/auth/signup` (or navigate via `/sign-up` — should redirect)

**Steps:**
1. Open `http://localhost:3000/sign-up`
2. Confirm browser redirects to `/auth/signup`
3. Fill in a valid email and a password ≥ 8 characters with at least one digit
4. Observe password strength indicators update as you type
5. Click **สมัครสมาชิก**

**Expected results:**

| Condition | Expected |
|---|---|
| Password < 8 chars | Button remains disabled |
| Password has no digit | Button remains disabled |
| Valid credentials | Success state shown: "สมัครสมาชิกสำเร็จ" |
| Confirmation email enabled (default) | Message: "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี" |
| Confirmation email disabled | Redirect to `/training` (session created immediately) |

---

### TC-02 · Email confirmation (if enabled)

**Steps:**
1. Open the confirmation email
2. Click the confirmation link
3. Browser opens `http://localhost:3000` or the Supabase callback URL
4. Navigate to `http://localhost:3000/auth/signin`

**Expected results:**
- Account is now active
- Sign-in will succeed in TC-03

> **Skip this test** if Supabase project has email confirmation disabled.

---

### TC-03 · Sign in

**URL:** `/auth/signin` (or navigate via `/sign-in` — should redirect)

**Steps:**
1. Open `http://localhost:3000/sign-in`
2. Confirm browser redirects to `/auth/signin`
3. Enter the email and password from TC-01
4. Click **เข้าสู่ระบบ**

**Expected results:**

| Condition | Expected |
|---|---|
| Wrong password | Error shown: Supabase error message or "เข้าสู่ระบบไม่สำเร็จ" |
| Empty email/password | Button is disabled |
| Correct credentials | Redirect to `/training` |
| Already signed in (visit signin page) | Auto-redirect to `/training` |

---

### TC-04 · Session restore after browser refresh

**Steps:**
1. After signing in (TC-03), you are at `/training`
2. Hard-refresh the browser (`Cmd+Shift+R` or `Ctrl+Shift+R`)
3. Navigate to `http://localhost:3000/settings`

**Expected results:**

| Step | Expected |
|---|---|
| Immediately after refresh | Brief loading state (spinner) in Account section |
| After session restored | Account section shows: email address + "เข้าสู่ระบบแล้ว" |
| CloudSyncPreview auth row | Shows: "เข้าสู่ระบบแล้ว: your@email.com" (green badge) |
| No "ยังไม่ได้เข้าสู่ระบบ" shown | Correct — session was restored |

**What verifies this works:**
- `AuthProvider` calls `getInitialSession()` on mount
- Supabase stores session in `localStorage` under its own key
- `onAuthStateChange` listener fires and updates React state

---

### TC-05 · Settings page — signed-out state

**Steps:**
1. If signed in, first complete TC-06 (sign out)
2. Navigate to `http://localhost:3000/settings`

**Expected results:**

| Element | Expected |
|---|---|
| Account section | Shows: "ยังไม่ได้เข้าสู่ระบบ" + links to sign in and sign up |
| Auth status row (CloudSyncPreview) | Shows: "ยังไม่ได้เข้าสู่ระบบ" |
| Sign-in CTA button | Visible: "เข้าสู่ระบบเพื่อเปิดใช้งานการซิงค์" (only if provider ≠ local) |
| Blocked reason banner | Shows appropriate message based on provider/env state |
| Upload button | Disabled — `disabled` attribute present, cursor is not-allowed |

---

### TC-06 · Sign out

**URL:** `/settings`

**Steps:**
1. Ensure you are signed in (TC-03/TC-04)
2. Navigate to `http://localhost:3000/settings`
3. In the **บัญชีผู้ใช้** section, click **ออกจากระบบ**
4. Observe the UI update

**Expected results:**

| Step | Expected |
|---|---|
| Click "ออกจากระบบ" | Button shows "กำลังออกจากระบบ…" briefly |
| After sign-out completes | Account section switches to "ยังไม่ได้เข้าสู่ระบบ" |
| Auth row in CloudSyncPreview | Switches to "ยังไม่ได้เข้าสู่ระบบ" |
| No page redirect | User stays on `/settings` (sign-out does not navigate) |
| Refresh page after sign-out | Still signed out — session is cleared |

---

### TC-07 · Settings page — signed-in state

**Steps:**
1. Sign in (TC-03) then navigate to `http://localhost:3000/settings`

**Expected results:**

| Element | Expected |
|---|---|
| Account section heading | Shows user's email address |
| "เข้าสู่ระบบแล้ว" label | Green text visible |
| "ออกจากระบบ" button | Visible and clickable (danger/red color) |
| Auth status row | Shows: "เข้าสู่ระบบแล้ว: email" with green check |
| Sign-in CTA | Hidden (user is already signed in) |
| Upload button | Still disabled regardless of auth state |

---

### TC-08 · Upload button is always disabled

**Steps:**
1. Test in both signed-out and signed-in states
2. Inspect the upload button in CloudSyncPreview

**Expected results:**

| Check | Expected |
|---|---|
| `disabled` HTML attribute | Present at all times |
| `aria-disabled="true"` | Present at all times |
| Cursor on hover | `cursor-not-allowed` |
| Click behavior | No action, no network request |
| Text below button | "ฟีเจอร์นี้อยู่ระหว่างพัฒนา — ข้อมูลของคุณปลอดภัยบนอุปกรณ์นี้" |

---

### TC-09 · Supabase not configured (placeholder credentials)

> This test verifies graceful degradation. Run with `.env.local` containing placeholder values.

**Conditions:** `NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co`

**Expected results:**

| Location | Expected |
|---|---|
| `/auth/signin` — try to sign in | Error message: "เกิดข้อผิดพลาด กรุณาลองใหม่" (network error caught) |
| `/settings` Account section | Loads; shows "ยังไม่ได้เข้าสู่ระบบ" after session check fails |
| `/settings` storage provider badge | "บน Device นี้" (provider=local) |
| Training, Progress, Rewards pages | Work normally — localStorage unaffected |

---

## Redirect Alias Verification

| URL visited | Expected redirect |
|---|---|
| `/sign-in` | → `/auth/signin` (permanent redirect) |
| `/sign-up` | → `/auth/signup` (permanent redirect) |

---

## localStorage Isolation Check

After all auth tests, verify that localStorage data is intact:

1. Open `/training` or `/progress`
2. Confirm any previously saved progress/profile is still visible
3. Check browser DevTools → Application → Local Storage
4. Keys present: `speech-adventure-progress-v1`, `speech-adventure-profile-v1`, etc.

**Auth must NOT touch these keys.** Supabase stores its own session under `sb-<ref>-auth-token`.

---

## Rollback: Return to Anonymous Mode

To remove Supabase Auth and return to pure localStorage mode:

1. Set `NEXT_PUBLIC_SUPABASE_URL=` (empty) in `.env.local`  
   **or** delete `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` entirely
2. Restart dev server
3. `isSupabaseConfigured()` returns `false` → auth context starts as `isLoading=false, isAuthenticated=false`
4. App runs fully in localStorage mode — no Supabase calls made

---

## What Remains Disabled (Phase 30)

| Feature | Status | When it activates |
|---|---|---|
| "อัปโหลดข้อมูลไปยัง Cloud" button | **Disabled** — no onClick | Phase 31+ |
| Supabase repository writes | **Off** — provider=local | Change `NEXT_PUBLIC_STORAGE_PROVIDER=supabase` |
| localStorage → Supabase data migration | **Not implemented** | Phase 31+ |
| Real-time sync | **Not implemented** | Phase 32+ |

---

## Related Files

| File | Role |
|---|---|
| `src/lib/supabase/client.ts` | `isSupabaseConfigured()`, `getSupabaseClient()` |
| `src/lib/auth/supabaseAuth.ts` | signIn, signUp, signOut, getInitialSession |
| `src/providers/AuthProvider.tsx` | React context; session restore on mount |
| `src/hooks/useAuth.ts` | Consumer hook |
| `src/app/auth/signin/page.tsx` | Sign-in form |
| `src/app/auth/signup/page.tsx` | Sign-up form with password rules |
| `src/app/sign-in/page.tsx` | Permanent redirect → `/auth/signin` |
| `src/app/sign-up/page.tsx` | Permanent redirect → `/auth/signup` |
| `src/app/settings/page.tsx` | Account section + sign-out button |
| `src/components/sync/CloudSyncPreview.tsx` | Auth status row in sync preview |
