"use client";

import { useState } from "react";
import { useObservationNotes } from "@/hooks/useObservationNotes";
import ObservationNoteCard from "@/components/observations/ObservationNoteCard";
import ObservationNoteForm from "@/components/observations/ObservationNoteForm";
import type { ObservationTargetType } from "@/types/observations";

interface Props {
  childId: string;
  targetType: ObservationTargetType;
  targetId: string;
}

export default function LinkedObservationNotes({ childId, targetType, targetId }: Props) {
  const { addNote, updateNote, deleteNote, getNotesForTarget } = useObservationNotes(childId);
  const [showForm, setShowForm] = useState(false);
  const notes = getNotesForTarget(targetType, targetId);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          บันทึกของผู้ปกครอง / ครู
          {notes.length > 0 && (
            <span className="ml-1.5 text-text normal-case">({notes.length})</span>
          )}
        </p>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            เพิ่มบันทึก
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-3">
          <ObservationNoteForm
            targetType={targetType}
            targetId={targetId}
            onSave={(data) => {
              addNote(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
            compact
          />
        </div>
      )}

      {notes.length === 0 && !showForm ? (
        <div className="text-center py-5 border border-dashed border-border rounded-xl">
          <p className="text-sm text-text-muted">ยังไม่มีบันทึก</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            เพิ่มบันทึกแรก
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <ObservationNoteCard
              key={note.id}
              note={note}
              onEdit={updateNote}
              onDelete={deleteNote}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
