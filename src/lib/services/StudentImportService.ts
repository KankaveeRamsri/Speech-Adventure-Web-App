/**
 * Pure CSV parsing and validation for the student import wizard.
 * No Supabase calls — all logic is deterministic given the inputs.
 */

import type { ParsedImportRow, ValidatedImportRow, ImportPreview } from "@/types/schoolImport";

// ── CSV parser ─────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

const COLUMN_ALIASES: Record<string, keyof ParsedImportRow | "_"> = {
  student_code:  "studentCode",
  name:          "name",
  nickname:      "nickname",
  age:           "ageRaw",
  grade_level:   "gradeLevel",
  classroom:     "classroom",
  parent_email:  "parentEmail",
  target_sounds: "targetSounds",
};

export function parseImportCSV(csvText: string): {
  rows: ParsedImportRow[];
  error?: string;
} {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { rows: [], error: "ไฟล์ว่างเปล่า" };
  if (lines.length === 1) return { rows: [], error: "ไม่พบข้อมูลนักเรียน (มีแค่แถวหัวตาราง)" };

  const headerRaw = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/\s+/g, "_"),
  );

  const colIndex: Partial<Record<string, number>> = {};
  for (const [csvCol, field] of Object.entries(COLUMN_ALIASES)) {
    const idx = headerRaw.indexOf(csvCol);
    if (idx !== -1) colIndex[field] = idx;
  }

  if (colIndex["name"] === undefined && colIndex["studentCode"] === undefined) {
    return {
      rows: [],
      error: "ไม่พบคอลัมน์ name หรือ student_code ในไฟล์ CSV",
    };
  }

  const rows: ParsedImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    const get = (field: string): string => {
      const idx = colIndex[field];
      return idx !== undefined ? (fields[idx] ?? "").trim() : "";
    };

    const ageRaw = get("ageRaw");
    const ageParsed = ageRaw ? parseInt(ageRaw, 10) : null;
    const age = ageParsed !== null && !isNaN(ageParsed) ? ageParsed : null;

    const targetSoundsRaw = get("targetSounds");
    const targetSounds = targetSoundsRaw
      ? targetSoundsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : ["ก"];

    rows.push({
      rowNumber:    i,
      studentCode:  get("studentCode"),
      name:         get("name"),
      nickname:     get("nickname"),
      ageRaw,
      age,
      gradeLevel:   get("gradeLevel"),
      classroom:    get("classroom"),
      parentEmail:  get("parentEmail"),
      targetSounds,
    });
  }

  return { rows };
}

// ── Validator ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateImportRows(
  rows: ParsedImportRow[],
  existingStudentCodes: Set<string>,
  existingClassroomNames: Set<string>,
  defaultClassroomName?: string,
): ImportPreview {
  const seenCodesInFile = new Set<string>();
  const seenRowKeys     = new Set<string>();
  const detectedClassrooms = new Set<string>();

  const validated: ValidatedImportRow[] = rows.map((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isExistingInDb = false;

    const effectiveClassroom = row.classroom || defaultClassroomName || "";

    // Required: name or student_code
    if (!row.name && !row.studentCode) {
      errors.push("ต้องระบุ name หรือ student_code");
    }

    // Required: classroom must exist in org
    if (!effectiveClassroom) {
      errors.push("ต้องระบุ classroom");
    } else if (!existingClassroomNames.has(effectiveClassroom)) {
      errors.push(`ไม่พบห้องเรียน "${effectiveClassroom}" ในองค์กร`);
    } else {
      detectedClassrooms.add(effectiveClassroom);
    }

    // Age validation
    if (row.ageRaw && (row.age === null || row.age < 1 || row.age > 18)) {
      errors.push(`อายุ "${row.ageRaw}" ไม่ถูกต้อง (ต้องอยู่ระหว่าง 1–18)`);
    }

    // Email validation
    if (row.parentEmail && !EMAIL_RE.test(row.parentEmail)) {
      errors.push(`รูปแบบอีเมล "${row.parentEmail}" ไม่ถูกต้อง`);
    }

    // Duplicate student_code handling
    if (row.studentCode) {
      if (seenCodesInFile.has(row.studentCode)) {
        warnings.push(`student_code "${row.studentCode}" ซ้ำในไฟล์ CSV — แถวนี้จะถูกข้าม`);
        isExistingInDb = true; // treat as "skip"
      } else {
        seenCodesInFile.add(row.studentCode);
      }

      if (existingStudentCodes.has(row.studentCode)) {
        warnings.push(`student_code "${row.studentCode}" มีอยู่ในระบบแล้ว — จะถูกข้าม`);
        isExistingInDb = true;
      }
    }

    // Fully duplicate rows
    const rowKey = `${row.studentCode}|${row.name}|${effectiveClassroom}`;
    if (seenRowKeys.has(rowKey)) {
      warnings.push("แถวนี้เหมือนกับแถวก่อนหน้า — จะถูกข้าม");
      isExistingInDb = true;
    } else {
      seenRowKeys.add(rowKey);
    }

    const status =
      errors.length > 0
        ? "error"
        : warnings.length > 0
        ? "warning"
        : "valid";

    return {
      ...row,
      classroom: effectiveClassroom,
      status,
      errors,
      warnings,
      isExistingInDb,
    };
  });

  const validCount   = validated.filter((r) => r.status === "valid").length;
  const warningCount = validated.filter((r) => r.status === "warning").length;
  const errorCount   = validated.filter((r) => r.status === "error").length;

  return {
    rows:         validated,
    validCount,
    warningCount,
    errorCount,
    classroomNames: [...detectedClassrooms],
  };
}

// ── Sample CSV ─────────────────────────────────────────────────────────────────

export const SAMPLE_CSV =
  `student_code,name,nickname,age,grade_level,classroom,parent_email,target_sounds\r\n` +
  `S001,เด็กชายอาร์ต,อาร์ต,6,K3,K3-A,parent1@example.com,"ก,ค"\r\n` +
  `S002,เด็กหญิงบี,บี,7,P1,P1-A,parent2@example.com,"ช,ต"\r\n`;
