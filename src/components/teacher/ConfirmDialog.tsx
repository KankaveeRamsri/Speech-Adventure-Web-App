"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import TeacherModal from "@/components/teacher/TeacherModal";

interface Props {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive action. */
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/**
 * Generic confirm modal for Teacher V2 (remove student, archive classroom…).
 * Handles its own busy / error state around the async onConfirm.
 */
export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "ยกเลิก",
  danger = false,
  onConfirm,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setBusy(false);
    }
  }

  return (
    <TeacherModal
      title={title}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 ${
              danger ? "bg-error hover:bg-error/90" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {busy ? "กำลังดำเนินการ…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-text leading-relaxed">{body}</div>
      {error && <p className="mt-3 text-xs text-error">{error}</p>}
    </TeacherModal>
  );
}
