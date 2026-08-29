/**
 * Teacher V2 — small shared display formatters. Timestamps are rendered
 * with the app's existing Thai (Buddhist-calendar) convention; no
 * destructive timezone conversion — `new Date(iso)` then `toLocaleString`.
 */

/** "29 ส.ค. 2569" */
export function thaiDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** "29 ส.ค. 2569 · 10:32" */
export function thaiDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${date} · ${time}`;
  } catch {
    return "—";
  }
}

/** "วันนี้" / "เมื่อวาน" / "3 วันที่แล้ว" / "2 สัปดาห์ที่แล้ว" / "1 เดือนที่แล้ว" */
export function thaiRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "—";
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "วันนี้";
  if (days === 1) return "เมื่อวาน";
  if (days < 7) return `${days} วันที่แล้ว`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์ที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}

/** "79%" or "—" for null. */
export function pct(score: number | null | undefined): string {
  return score == null || Number.isNaN(score) ? "—" : `${Math.round(score)}%`;
}

/** "+18%" / "−4%" / "0%" */
export function signedPct(delta: number | null | undefined): string {
  if (delta == null || Number.isNaN(delta)) return "—";
  const rounded = Math.round(delta);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `−${Math.abs(rounded)}%`;
  return "0%";
}
