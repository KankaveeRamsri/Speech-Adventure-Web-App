import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { evaluateSpeech } from "@/lib/speech-evaluation/evaluateSpeech";
import type { SpeechEvaluationInput } from "@/lib/speech-evaluation/types";

interface RawBody {
  stageId?: unknown;
  practiceItemId?: unknown;
  targetSound?: unknown;
  promptText?: unknown;
  itemType?: unknown;
  durationMs?: unknown;
  audioUrl?: unknown;
  selectedChoice?: unknown;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function toNumber(v: unknown): number | null {
  const n = Number(v);
  return isNaN(n) || v === null || v === "" ? null : n;
}

export async function POST(request: NextRequest) {
  let body: RawBody;
  try {
    body = (await request.json()) as RawBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { stageId, practiceItemId, targetSound, promptText, itemType, durationMs } = body;

  const missingStrings = (
    ["stageId", "practiceItemId", "targetSound", "promptText", "itemType"] as const
  ).filter((field) => !isNonEmptyString(body[field]));

  if (missingStrings.length > 0) {
    return NextResponse.json(
      { error: `Missing or invalid fields: ${missingStrings.join(", ")}` },
      { status: 400 }
    );
  }

  const parsedDuration = toNumber(durationMs);
  if (parsedDuration === null || parsedDuration < 0) {
    return NextResponse.json(
      { error: "Missing or invalid field: durationMs must be a non-negative number" },
      { status: 400 }
    );
  }

  const input: SpeechEvaluationInput = {
    stageId: stageId as string,
    practiceItemId: practiceItemId as string,
    targetSound: targetSound as string,
    promptText: promptText as string,
    itemType: itemType as string,
    durationMs: parsedDuration,
    audioUrl: isNonEmptyString(body.audioUrl) ? body.audioUrl : undefined,
    selectedChoice: isNonEmptyString(body.selectedChoice) ? body.selectedChoice : undefined,
  };

  const result = await evaluateSpeech(input);
  return NextResponse.json(result);
}
