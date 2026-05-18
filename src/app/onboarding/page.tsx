"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  saveProfile,
  getProfile,
  clearProfile,
  replaceProfile,
} from "@/lib/child-profile/childProfileStorage";
import { setSelectedSoundId } from "@/lib/speechProgressStorage";
import { mockTargetSounds } from "@/data/speechAdventureMockData";
import {
  exportData,
  importData,
  clearAllData,
  readBackupFile,
  getStorageSummary,
} from "@/lib/local-data/localDataBackup";
import { loadDemoProgress } from "@/lib/demo/speechAdventureDemoData";
import { DEMO_ATTEMPT_COUNT } from "@/lib/demo/speechAdventureDemoData";
import { clearObservations } from "@/lib/observations/observationStorage";
import { clearProgress, replaceProgress } from "@/lib/speechProgressStorage";
import { replaceObservations } from "@/lib/observations/observationStorage";

type Step = 1 | 2 | 3 | 4 | 5;

const GOALS = [
  { id: "daily", label: "ทุกวัน", desc: "วันละ 10–15 นาที สม่ำเสมอ" },
  { id: "3x-week", label: "3 วัน/สัปดาห์", desc: "ฝึกสัปดาห์ละ 3 ครั้ง" },
  { id: "casual", label: "เมื่อมีเวลา", desc: "ค่อยเป็นค่อยไป ไม่กดดัน" },
];

const GOAL_LABELS: Record<string, string> = {
  daily: "ทุกวัน",
  "3x-week": "3 วัน/สัปดาห์",
  casual: "เมื่อมีเวลา",
};

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState(5);
  const [targetSound, setTargetSound] = useState("ก");
  const [trainingGoal, setTrainingGoal] = useState("daily");
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const existing = getProfile();
    if (existing) {
      setName(existing.name);
      setAge(existing.age);
      setTargetSound(existing.targetSound);
      setTrainingGoal(existing.trainingGoal);
      setIsEdit(true);
      setStep(2);
    }
  }, []);

  const handleFinish = () => {
    const now = new Date().toISOString();
    const existing = getProfile();
    saveProfile({
      id: existing?.id ?? `child-${Date.now()}`,
      name: name.trim(),
      age,
      targetSound,
      trainingGoal,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    setSelectedSoundId(targetSound);
    router.push(isEdit ? "/training" : "/training/pretest");
  };

  const totalSteps = 4; // steps 2–5
  const progressStep = (step as number) - 1; // 1..4 for steps 2..5

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      {/* ── Top bar (hidden on welcome step) ── */}
      {step > 1 && (
        <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-6 py-3 max-w-xl mx-auto">
            <button
              onClick={() => setStep((s) => Math.max(2, s - 1) as Step)}
              className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
            >
              <BackIcon />
              <span className="text-sm font-medium hidden sm:inline">ย้อนกลับ</span>
            </button>

            <div className="flex items-center gap-1.5">
              {[2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step
                      ? "w-6 bg-primary"
                      : s < step
                      ? "w-3 bg-primary/50"
                      : "w-3 bg-border"
                  }`}
                />
              ))}
            </div>

            <span className="text-sm text-text-muted w-16 text-right">
              {progressStep}/{totalSteps}
            </span>
          </div>
        </nav>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-text mb-3">
                  ยินดีต้อนรับสู่<br />
                  <span className="text-primary">Speech Adventure</span>
                </h1>
                <p className="text-text-muted text-base leading-relaxed max-w-sm mx-auto">
                  ระบบฝึกพูดสำหรับเด็กไทย ออกแบบโดยผู้เชี่ยวชาญด้านนักบำบัดการพูด
                  ใช้เวลาเพียง 2 นาทีในการตั้งค่าเริ่มต้น
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  { icon: "🎯", label: "7 ระดับการฝึก" },
                  { icon: "🎙️", label: "อัดเสียงได้" },
                  { icon: "📊", label: "ติดตามผล" },
                ].map((f) => (
                  <div key={f.label} className="bg-surface border border-border rounded-xl px-3 py-3 text-center">
                    <div className="text-xl mb-1">{f.icon}</div>
                    <p className="text-xs text-text-muted">{f.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary text-white font-semibold px-8 py-4 rounded-xl text-base hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-primary/25"
              >
                เริ่มตั้งค่าเลย →
              </button>

              <button
                onClick={() => router.push("/")}
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                ข้ามและไปหน้าแรก
              </button>
            </div>
          )}

          {/* ── Step 2: Name + Age ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-text mb-1">ชื่อน้องคืออะไร?</h2>
                <p className="text-text-muted">เราจะใช้ชื่อนี้ในการฝึกค่ะ</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    ชื่อ-นามสกุล (หรือชื่อเล่น)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น น้องส้ม หรือ อรวรรณ สุขใจ"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    อายุ: <span className="text-primary font-bold">{age} ปี</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAge((a) => Math.max(3, a - 1))}
                      className="w-11 h-11 rounded-xl border border-border bg-surface hover:bg-gray-100 dark:hover:bg-white/8 flex items-center justify-center text-text font-bold text-lg transition-all active:scale-95"
                    >
                      –
                    </button>
                    <div className="flex-1 flex gap-1.5 flex-wrap justify-center">
                      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((y) => (
                        <button
                          key={y}
                          onClick={() => setAge(y)}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                            age === y
                              ? "bg-primary text-white shadow-sm shadow-primary/25"
                              : "bg-surface border border-border text-text-muted hover:border-primary/40 hover:text-primary"
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setAge((a) => Math.min(12, a + 1))}
                      className="w-11 h-11 rounded-xl border border-border bg-surface hover:bg-gray-100 dark:hover:bg-white/8 flex items-center justify-center text-text font-bold text-lg transition-all active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!name.trim()}
                className="w-full bg-primary text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                ถัดไป →
              </button>
            </div>
          )}

          {/* ── Step 3: Target Sound ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-text mb-1">เลือกเสียงที่ต้องการฝึก</h2>
                <p className="text-text-muted">เสียงพยัญชนะที่น้องต้องการพัฒนา</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {mockTargetSounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => setTargetSound(sound.id)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left active:scale-[0.98] ${
                      targetSound === sound.id
                        ? "border-primary bg-primary/8"
                        : "border-border bg-surface hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${
                        targetSound === sound.id
                          ? "bg-primary text-white"
                          : "bg-bg text-text"
                      }`}
                    >
                      {sound.label}
                    </span>
                    <div>
                      <p className={`font-semibold text-sm ${targetSound === sound.id ? "text-primary" : "text-text"}`}>
                        {sound.description}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">เสียง {sound.id}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(4)}
                className="w-full bg-primary text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all active:scale-[0.99]"
              >
                ถัดไป →
              </button>
            </div>
          )}

          {/* ── Step 4: Training Goal ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-text mb-1">เป้าหมายการฝึก</h2>
                <p className="text-text-muted">จะฝึกบ่อยแค่ไหนในแต่ละสัปดาห์?</p>
              </div>

              <div className="space-y-3">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setTrainingGoal(goal.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all text-left active:scale-[0.99] ${
                      trainingGoal === goal.id
                        ? "border-primary bg-primary/8"
                        : "border-border bg-surface hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <p className={`font-semibold ${trainingGoal === goal.id ? "text-primary" : "text-text"}`}>
                        {goal.label}
                      </p>
                      <p className="text-sm text-text-muted mt-0.5">{goal.desc}</p>
                    </div>
                    {trainingGoal === goal.id && (
                      <span className="text-primary flex-shrink-0 ml-3">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(5)}
                className="w-full bg-primary text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all active:scale-[0.99]"
              >
                ถัดไป →
              </button>
            </div>
          )}

          {/* ── Step 5: Confirmation ── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-text mb-1">
                  {isEdit ? "บันทึกการเปลี่ยนแปลง" : "พร้อมเริ่มต้นแล้ว!"}
                </h2>
                <p className="text-text-muted">ตรวจสอบข้อมูลก่อนเริ่มฝึก</p>
              </div>

              <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-text-muted">ชื่อน้อง</span>
                  <span className="font-semibold text-text">{name.trim()}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-text-muted">อายุ</span>
                  <span className="font-semibold text-text">{age} ปี</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-text-muted">เสียงที่ฝึก</span>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {targetSound}
                    </span>
                    <span className="font-semibold text-text">
                      {mockTargetSounds.find((s) => s.id === targetSound)?.description}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-text-muted">เป้าหมาย</span>
                  <span className="font-semibold text-text">{GOAL_LABELS[trainingGoal]}</span>
                </div>
              </div>

              <div className="bg-info/8 border border-info/20 rounded-xl px-4 py-3">
                <p className="text-sm text-info">
                  {isEdit
                    ? "การเปลี่ยนเสียงจะไม่ลบประวัติการฝึกเดิม"
                    : "ระบบจะเริ่ม Pre-test เพื่อประเมินระดับเสียงเริ่มต้น ไม่ต้องกังวล ไม่มีผิดไม่มีถูกค่ะ"}
                </p>
              </div>

              <button
                onClick={handleFinish}
                className="w-full bg-primary text-white font-semibold px-8 py-4 rounded-xl text-base hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-primary/25"
              >
                {isEdit ? "บันทึกและกลับไปฝึก" : "เริ่ม Pre-test เลย →"}
              </button>

              {!isEdit && (
                <button
                  onClick={() => {
                    const now = new Date().toISOString();
                    const existing = getProfile();
                    saveProfile({
                      id: existing?.id ?? `child-${Date.now()}`,
                      name: name.trim(),
                      age,
                      targetSound,
                      trainingGoal,
                      createdAt: existing?.createdAt ?? now,
                      updatedAt: now,
                    });
                    setSelectedSoundId(targetSound);
                    router.push("/training");
                  }}
                  className="w-full border border-border text-text-muted hover:text-text hover:border-primary/40 font-medium px-8 py-3 rounded-xl text-sm transition-all active:scale-[0.99]"
                >
                  ข้าม Pre-test ไปที่แผนที่การฝึกก่อน
                </button>
              )}

              {/* ── Data Management (edit mode only) ── */}
              {isEdit && <DataManagerSection />}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

// ── Data Manager Section ──────────────────────────────────────────────────────

type ConfirmState = "clear" | "import" | null;

function DataManagerSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [storageInfo, setStorageInfo] = useState(getStorageSummary());

  useEffect(() => {
    setStorageInfo(getStorageSummary());
  }, []);

  const flash = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ── Export ──
  const handleExport = () => {
    try {
      exportData();
      flash("success", "ส่งออกข้อมูลสำเร็จ — ไฟล์จะถูกดาวน์โหลดไปยังเครื่องของคุณ");
    } catch {
      flash("error", "เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  // ── Import ──
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const backup = await readBackupFile(file);
      const result = importData(backup);

      if (result.success) {
        // Trigger storage subscribers to refresh
        const rawProgress = localStorage.getItem("speech-adventure-progress-v1");
        if (rawProgress) {
          try { replaceProgress(JSON.parse(rawProgress)); } catch { /* ignore */ }
        }
        const rawObs = localStorage.getItem("speech-adventure-observations-v1");
        if (rawObs) {
          try { replaceObservations(JSON.parse(rawObs)); } catch { /* ignore */ }
        }
        const rawProfile = localStorage.getItem("speech-adventure-profile-v1");
        if (rawProfile) {
          try { replaceProfile(JSON.parse(rawProfile)); } catch { /* ignore */ }
        }

        setStorageInfo(getStorageSummary());
        flash("success", "นำเข้าข้อมูลสำเร็จ — ข้อมูลถูกกู้คืนแล้ว");
      } else {
        flash("error", result.error);
      }
    } catch (err) {
      flash("error", err instanceof Error ? err.message : "ไม่สามารถอ่านไฟล์ได้");
    }

    setConfirmState(null);
  };

  const confirmImport = () => setConfirmState("import");

  // ── Clear ──
  const handleClear = () => {
    clearProgress();
    clearObservations();
    clearProfile();
    clearAllData();
    setStorageInfo(getStorageSummary());
    setConfirmState(null);
    flash("success", "ล้างข้อมูลทั้งหมดสำเร็จ — ยังคงตั้งค่าธีมและเมนูไว้");
  };

  // ── Demo ──
  const handleLoadDemo = () => {
    loadDemoProgress();
    setStorageInfo(getStorageSummary());
    flash("success", `โหลดข้อมูลสาธิตสำเร็จ (${DEMO_ATTEMPT_COUNT} ครั้ง)`);
  };

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="mb-4">
        <h3 className="text-base font-bold text-text">จัดการข้อมูล</h3>
        <p className="text-sm text-text-muted mt-0.5">
          ข้อมูลทั้งหมดเก็บไว้ในเครื่องของคุณ (localStorage) — ยังไม่มีระบบออนไลน์
        </p>
      </div>

      {/* Storage status */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {storageInfo.hasProfile && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
            มีโปรไฟล์
          </span>
        )}
        {storageInfo.hasProgress && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-info/10 text-info text-xs font-semibold">
            มีข้อมูลการฝึก
          </span>
        )}
        {storageInfo.hasObservations && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
            มีบันทึก
          </span>
        )}
        {!storageInfo.hasProfile && !storageInfo.hasProgress && !storageInfo.hasObservations && (
          <span className="text-xs text-text-muted">ยังไม่มีข้อมูลในระบบ</span>
        )}
      </div>

      {/* Flash message */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-error/10 text-error border border-error/20"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Confirm dialogs */}
      {confirmState === "clear" && (
        <div className="mb-4 bg-surface border border-error/25 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-text mb-1">ล้างข้อมูลทั้งหมด?</p>
          <p className="text-xs text-text-muted mb-4">
            ข้อมูลโปรไฟล์ การฝึก บันทึก จะถูกลบทั้งหมด ไม่สามารถกู้คืนได้
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setConfirmState(null)}
              className="px-5 py-2 rounded-xl border border-border text-text-muted font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleClear}
              className="px-5 py-2 rounded-xl bg-error text-white font-semibold text-sm hover:bg-error/90 transition-all"
            >
              ล้างข้อมูล
            </button>
          </div>
        </div>
      )}

      {confirmState === "import" && (
        <div className="mb-4 bg-surface border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-text mb-1">นำเข้าข้อมูลสำรอง?</p>
          <p className="text-xs text-text-muted mb-4">
            ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลจากไฟล์สำรอง
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setConfirmState(null)}
              className="px-5 py-2 rounded-xl border border-border text-text-muted font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all"
            >
              เลือกไฟล์และนำเข้า
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!confirmState && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface border border-border text-sm font-semibold text-text hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.98]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              ส่งออกข้อมูล
            </button>
            <button
              onClick={confirmImport}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface border border-border text-sm font-semibold text-text hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.98]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              นำเข้าข้อมูล
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleLoadDemo}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/8 border border-primary/15 text-sm font-semibold text-primary hover:bg-primary/12 transition-all active:scale-[0.98]"
            >
              โหลดข้อมูลสาธิต
            </button>
            <button
              onClick={() => setConfirmState("clear")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-error/30 text-sm font-semibold text-error hover:bg-error/8 transition-all active:scale-[0.98]"
            >
              ล้างข้อมูลทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
