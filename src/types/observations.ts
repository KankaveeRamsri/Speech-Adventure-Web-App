export type ObservationTargetType = "session" | "attempt" | "general";

export type ObservationCategory =
  | "pronunciation"
  | "attention"
  | "progress"
  | "recommendation"
  | "other";

export interface ObservationNote {
  id: string;
  childId: string;
  targetType: ObservationTargetType;
  targetId?: string;
  category: ObservationCategory;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_META: Record<
  ObservationCategory,
  { label: string; color: string }
> = {
  pronunciation: { label: "การออกเสียง", color: "#6C63FF" },
  attention:     { label: "ความตั้งใจ",   color: "#5BC0EB" },
  progress:      { label: "พัฒนาการ",      color: "#4CAF82" },
  recommendation:{ label: "คำแนะนำ",      color: "#FFB347" },
  other:         { label: "อื่นๆ",          color: "#94A3B8" },
};
