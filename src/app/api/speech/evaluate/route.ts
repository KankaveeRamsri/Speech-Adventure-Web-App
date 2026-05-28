import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { evaluateSpeech } from "@/lib/speech-evaluation/evaluateSpeech";
import type { SpeechEvaluationInput } from "@/lib/speech-evaluation/types";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function toNumber(v: unknown): number | null {
  const n = Number(v);
  return isNaN(n) || v === null || v === "" ? null : n;
}

const REQUIRED_STRING_FIELDS = [
  "stageId",
  "practiceItemId",
  "targetSound",
  "promptText",
  "itemType",
] as const;

type RequiredField = (typeof REQUIRED_STRING_FIELDS)[number];

function validateStringFields(
  fields: Record<RequiredField, unknown>,
): string[] {
  return REQUIRED_STRING_FIELDS.filter((f) => !isNonEmptyString(fields[f]));
}

/** Parse request body from either multipart/form-data or application/json. */
async function parseRequest(request: NextRequest): Promise<{
  fields: Record<string, unknown>;
  audioBuffer?: Buffer;
  audioMimeType?: string;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    const fields: Record<string, unknown> = {};
    let audioBuffer: Buffer | undefined;
    let audioMimeType: string | undefined;

    for (const [key, value] of formData.entries()) {
      if (key === "audio" && value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        audioMimeType = value.type;
      } else {
        fields[key] = value;
      }
    }

    return { fields, audioBuffer, audioMimeType };
  }

  // Default: JSON body
  const body = (await request.json()) as Record<string, unknown>;
  return { fields: body };
}

export async function POST(request: NextRequest) {
  let parsed: Awaited<ReturnType<typeof parseRequest>>;
  try {
    parsed = await parseRequest(request);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { fields, audioBuffer, audioMimeType } = parsed;

  const missingStrings = validateStringFields(
    fields as Record<RequiredField, unknown>,
  );
  if (missingStrings.length > 0) {
    return NextResponse.json(
      { error: `Missing or invalid fields: ${missingStrings.join(", ")}` },
      { status: 400 },
    );
  }

  const parsedDuration = toNumber(fields.durationMs);
  if (parsedDuration === null || parsedDuration < 0) {
    return NextResponse.json(
      { error: "Missing or invalid field: durationMs must be a non-negative number" },
      { status: 400 },
    );
  }

  const input: SpeechEvaluationInput = {
    stageId: fields.stageId as string,
    practiceItemId: fields.practiceItemId as string,
    targetSound: fields.targetSound as string,
    promptText: fields.promptText as string,
    itemType: fields.itemType as string,
    durationMs: parsedDuration,
    audioUrl: isNonEmptyString(fields.audioUrl) ? (fields.audioUrl as string) : undefined,
    selectedChoice: isNonEmptyString(fields.selectedChoice)
      ? (fields.selectedChoice as string)
      : undefined,
    childId: isNonEmptyString(fields.childId) ? (fields.childId as string) : undefined,
    audioBuffer,
    audioMimeType,
  };

  try {
    const result = await evaluateSpeech(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/speech/evaluate] unhandled error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "ยังประเมินเสียงไม่ได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }
}
