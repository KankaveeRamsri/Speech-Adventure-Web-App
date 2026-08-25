import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
}

/**
 * Shared placeholder state for Teacher V2 routes whose real functionality
 * belongs to a later phase (Classrooms/Students/Assignments/Reports in
 * Phase 1). Keeps the four placeholder pages from duplicating the same
 * markup, and keeps them honest — no fabricated data or fake controls.
 */
export default function ComingSoonPanel({ icon, title, description }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4 text-primary">
          {icon}
        </div>
        <h1 className="text-lg font-bold text-text mb-1.5">{title}</h1>
        <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">{description}</p>
        <span className="inline-block mt-5 text-xs font-semibold text-primary bg-primary/8 px-3 py-1.5 rounded-full">
          เร็วๆ นี้
        </span>
      </div>
    </div>
  );
}
