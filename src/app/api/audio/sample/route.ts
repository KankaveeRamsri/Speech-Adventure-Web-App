import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateSampleAudio, MAX_SAMPLE_TEXT_LENGTH } from "@/lib/sample-audio/service";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const expectedText = typeof body.expectedText === "string" ? body.expectedText.trim() : "";
  if (!expectedText) {
    return NextResponse.json({ error: "expectedText is required" }, { status: 400 });
  }
  if (expectedText.length > MAX_SAMPLE_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `expectedText exceeds ${MAX_SAMPLE_TEXT_LENGTH} characters` },
      { status: 400 },
    );
  }

  const stageId = typeof body.stageId === "string" ? body.stageId : "unknown";
  const targetSound = typeof body.targetSound === "string" ? body.targetSound : undefined;
  const locale = typeof body.locale === "string" ? body.locale : "th-TH";

  try {
    const result = await generateSampleAudio({ expectedText, stageId, targetSound, locale });
    return NextResponse.json(result);
  } catch (err) {
    console.error(
      "[/api/audio/sample]",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "เล่นเสียงตัวอย่างไม่ได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }
}
