"use client";

import { useState } from "react";
import type { ObservationNote } from "@/types/observations";
import { CATEGORY_META } from "@/types/observations";
import ObservationNoteForm from "./ObservationNoteForm";

interface Props {
  note: ObservationNote;
  onEdit: (id: string, changes: { title: string; content: string; category: import("@/types/observations").ObservationCategory }) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function TargetTypeBadge({ targetType }: { targetType: string }) {
  if (targetType === "general") return null;
  const label = targetType === "session" ? "เซสชัน" : "การฝึก";
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary">
      {label}
    </span>
  );
}

export default function ObservationNoteCard({ note, onEdit, onDelete, compact = false }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const meta = CATEGORY_META[note.category];
  const isLong = note.content.length > 120;
  const displayContent = isLong && !expanded ? note.content.slice(0, 120) + "…" : note.content;

  if (isEditing) {
    return (
      <ObservationNoteForm
        targetType={note.targetType}
        targetId={note.targetId}
        initialData={{ category: note.category, title: note.title, content: note.content }}
        onSave={(data) => {
          onEdit(note.id, { title: data.title, content: data.content, category: data.category });
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className={`bg-surface border border-border rounded-xl transition-all hover:border-border/70 ${compact ? "p-3" : "p-4"}`}>
      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        <span
          className="inline-block shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${meta.color}14`, color: meta.color }}
        >
          {meta.label}
        </span>
        <TargetTypeBadge targetType={note.targetType} />
        <div className="flex-1" />
        <time className="text-xs text-text-muted/60 shrink-0">{formatDate(note.createdAt)}</time>
      </div>

      {/* Title */}
      {note.title && (
        <p className={`font-semibold text-text mb-1 ${compact ? "text-sm" : "text-base"}`}>
          {note.title}
        </p>
      )}

      {/* Content */}
      <p className={`text-text-muted leading-relaxed ${compact ? "text-xs" : "text-sm"}`}>
        {displayContent}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-primary hover:text-primary/80 mt-1 transition-colors"
        >
          {expanded ? "ย่อลง" : "อ่านต่อ"}
        </button>
      )}

      {/* Delete confirm */}
      {showConfirmDelete && (
        <div className="mt-3 flex items-center gap-2 bg-error/6 border border-error/20 rounded-xl p-3">
          <p className="text-xs text-text flex-1">ลบบันทึกนี้?</p>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(false)}
            className="text-xs font-medium text-text-muted px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-error hover:bg-error/90 transition-all"
          >
            ลบ
          </button>
        </div>
      )}

      {/* Actions */}
      {!showConfirmDelete && (
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border/60">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-text-muted hover:text-primary transition-colors"
            aria-label="แก้ไขบันทึก"
          >
            แก้ไข
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="text-xs text-text-muted hover:text-error transition-colors"
            aria-label="ลบบันทึก"
          >
            ลบ
          </button>
          {note.updatedAt !== note.createdAt && (
            <span className="text-xs text-text-muted/40 ml-auto">
              แก้ไขล่าสุด {formatDate(note.updatedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
