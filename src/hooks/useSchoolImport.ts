"use client";

import { useState, useCallback } from "react";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import { parseImportCSV, validateImportRows } from "@/lib/services/StudentImportService";
import type { ImportPreview, ValidatedImportRow, ImportResult } from "@/types/schoolImport";
import type { Classroom } from "@/types/school";

export type ImportStep = "upload" | "preview" | "confirm" | "result";

/**
 * State machine for the 4-step CSV student import wizard.
 * Orchestrates: parse → validate → confirm → write to repository.
 */
export function useSchoolImport(organizationId: string) {
  const { school } = useRepositories();

  const [step, setStep]       = useState<ImportStep>("upload");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult]   = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const parseAndPreview = useCallback(
    async (csvText: string, defaultClassroomName?: string) => {
      if (!school) { setError("ไม่สามารถเข้าถึงข้อมูลได้"); return; }

      setLoading(true);
      setError(null);

      try {
        const { rows, error: parseError } = parseImportCSV(csvText);
        if (parseError || !rows.length) {
          setError(parseError ?? "ไม่พบข้อมูลในไฟล์");
          return;
        }

        const orgClassrooms = school.listClassrooms(organizationId);
        setClassrooms(orgClassrooms);

        const existingCodes = await school.listStudentCodes(organizationId);
        const existingCodesSet    = new Set(existingCodes);
        const existingClassroomsSet = new Set(orgClassrooms.map((c) => c.name));

        const previewData = validateImportRows(
          rows,
          existingCodesSet,
          existingClassroomsSet,
          defaultClassroomName,
        );

        setPreview(previewData);
        setStep("preview");
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    },
    [school, organizationId],
  );

  const confirmImport = useCallback(
    async (userId: string) => {
      if (!school || !preview) return;

      setLoading(true);
      setError(null);

      try {
        const importable = preview.rows.filter(
          (r): r is ValidatedImportRow => r.status !== "error",
        );
        const importResult = await school.importStudents(
          importable,
          classrooms,
          organizationId,
          userId,
        );
        setResult(importResult);
        setStep("result");
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    },
    [school, preview, classrooms, organizationId],
  );

  const reset = useCallback(() => {
    setStep("upload");
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    step,
    setStep,
    preview,
    result,
    loading,
    error,
    classrooms,
    parseAndPreview,
    confirmImport,
    reset,
  };
}
