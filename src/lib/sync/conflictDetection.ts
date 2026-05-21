/**
 * Conflict detection utilities for data sync safety.
 *
 * Evaluates whether local and cloud data overlap and provides a safe
 * recommended action. No data is read or written here — pure logic only.
 *
 * "Both have data" is the most dangerous state: sessions/attempts in
 * migrateToSupabase.ts are NOT idempotent — each run inserts new rows.
 * Uploading when cloud already has data will create duplicates.
 *
 * See docs/architecture/conflict-strategy.md for the full policy.
 */

/** Level of data overlap between local device and cloud. */
export type ConflictRisk =
  | "none"        // no overlap — safe
  | "cloud_only"  // cloud has data, local is empty — nothing to upload
  | "both";       // both have data — upload will create duplicates

/**
 * Safe recommended action given the current local/cloud state.
 * "confirm_overwrite" does NOT mean overwriting cloud data — it means the user
 * must explicitly acknowledge the duplicate risk before uploading.
 */
export type RecommendedUploadAction =
  | "upload"             // local has data, cloud is empty — safe to upload
  | "view_cloud"         // cloud has data, local is empty — nothing to upload
  | "confirm_overwrite"  // BOTH have data — require explicit acknowledgement
  | "none";              // no data anywhere, or prerequisites not met

export interface ConflictAssessment {
  localHasData: boolean;
  cloudHasData: boolean;
  conflictRisk: ConflictRisk;
  recommendedAction: RecommendedUploadAction;
  /** Non-null when conflictRisk is not "none". Shown to the user in Thai. */
  warningMessage: string | null;
}

/**
 * Evaluates the data conflict state from boolean presence flags.
 * Pure function — no side effects, no network calls, no storage reads.
 */
export function assessConflict(
  localHasData: boolean,
  cloudHasData: boolean,
): ConflictAssessment {
  if (!localHasData && !cloudHasData) {
    return {
      localHasData,
      cloudHasData,
      conflictRisk: "none",
      recommendedAction: "none",
      warningMessage: null,
    };
  }

  if (localHasData && !cloudHasData) {
    return {
      localHasData,
      cloudHasData,
      conflictRisk: "none",
      recommendedAction: "upload",
      warningMessage: null,
    };
  }

  if (!localHasData && cloudHasData) {
    return {
      localHasData,
      cloudHasData,
      conflictRisk: "cloud_only",
      recommendedAction: "view_cloud",
      warningMessage: "มีข้อมูลบน Cloud อยู่แล้ว — ไม่จำเป็นต้องอัปโหลด",
    };
  }

  // Both have data — most dangerous case
  return {
    localHasData,
    cloudHasData,
    conflictRisk: "both",
    recommendedAction: "confirm_overwrite",
    warningMessage:
      "พบข้อมูลทั้งบน Cloud และบนอุปกรณ์นี้ — การอัปโหลดจะเพิ่มข้อมูลซ้ำในฐานข้อมูล กรุณาตรวจสอบก่อนดำเนินการ",
  };
}
