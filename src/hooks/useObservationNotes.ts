"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ObservationNote, ObservationCategory, ObservationTargetType } from "@/types/observations";
import { useRepositories } from "@/lib/providers/RepositoryProvider";

function generateId(): string {
  return `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useObservationNotes(childId = "") {
  const { observations: repo } = useRepositories();

  const allNotes = useSyncExternalStore<ObservationNote[]>(
    repo.subscribe.bind(repo),
    repo.getNotes.bind(repo),
    repo.getServerNotes.bind(repo),
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
      repo.addNote(note);
      return note;
    },
    [childId, repo],
  );

  const updateNote = useCallback(
    (id: string, changes: Partial<Pick<ObservationNote, "title" | "content" | "category">>) => {
      const existing = allNotes.find((n) => n.id === id);
      if (!existing) return;
      repo.updateNote({ ...existing, ...changes, updatedAt: new Date().toISOString() });
    },
    [allNotes, repo],
  );

  const deleteNote = useCallback((id: string) => {
    repo.deleteNote(id);
  }, [repo]);

  const clearNotes = useCallback(() => {
    repo.clearNotes();
  }, [repo]);

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
    clearNotes,
    getNotesForTarget,
  };
}
