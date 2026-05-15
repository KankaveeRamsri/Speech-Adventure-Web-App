"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ObservationNote, ObservationCategory, ObservationTargetType } from "@/types/observations";
import {
  getObservations,
  getServerObservations,
  subscribeToObservations,
  addObservation as storageAdd,
  updateObservation as storageUpdate,
  deleteObservation as storageDelete,
} from "@/lib/observations/observationStorage";

function generateId(): string {
  return `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useObservationNotes(childId = "child-001") {
  const allNotes = useSyncExternalStore<ObservationNote[]>(
    subscribeToObservations,
    getObservations,
    getServerObservations,
  );

  const notes = allNotes.filter((n) => n.childId === childId);

  const addNote = useCallback(
    (input: {
      targetType: ObservationTargetType;
      targetId?: string;
      category: ObservationCategory;
      title: string;
      content: string;
    }) => {
      const now = new Date().toISOString();
      const note: ObservationNote = {
        id: generateId(),
        childId,
        targetType: input.targetType,
        targetId: input.targetId,
        category: input.category,
        title: input.title.trim(),
        content: input.content.trim(),
        createdAt: now,
        updatedAt: now,
      };
      storageAdd(note);
      return note;
    },
    [childId],
  );

  const updateNote = useCallback(
    (id: string, changes: Partial<Pick<ObservationNote, "title" | "content" | "category">>) => {
      const existing = allNotes.find((n) => n.id === id);
      if (!existing) return;
      storageUpdate({ ...existing, ...changes, updatedAt: new Date().toISOString() });
    },
    [allNotes],
  );

  const deleteNote = useCallback((id: string) => {
    storageDelete(id);
  }, []);

  const getNotesForTarget = useCallback(
    (targetType: ObservationTargetType, targetId?: string) => {
      return notes.filter(
        (n) => n.targetType === targetType && (targetId === undefined || n.targetId === targetId),
      );
    },
    [notes],
  );

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return {
    notes,
    recentNotes,
    addNote,
    updateNote,
    deleteNote,
    getNotesForTarget,
  };
}
