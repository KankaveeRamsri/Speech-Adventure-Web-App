// Types for the CSV student import wizard.

export type ImportRowStatus = "valid" | "warning" | "error";

export type ParsedImportRow = {
  rowNumber: number;
  studentCode: string;
  name: string;
  nickname: string;
  ageRaw: string;
  age: number | null;
  gradeLevel: string;
  classroom: string;
  parentEmail: string;
  targetSounds: string[];
};

export type ValidatedImportRow = ParsedImportRow & {
  status: ImportRowStatus;
  errors: string[];
  warnings: string[];
  isExistingInDb: boolean;
};

export type ImportPreview = {
  rows: ValidatedImportRow[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  classroomNames: string[];
};

export type ImportRowResult = {
  rowNumber: number;
  status: "created" | "skipped" | "failed";
  message?: string;
};

export type ImportResult = {
  results: ImportRowResult[];
  createdCount: number;
  skippedCount: number;
  failedCount: number;
};
