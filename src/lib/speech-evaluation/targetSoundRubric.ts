export interface TargetSoundRubric {
  id: string;
  symbol: string;
  label: string;
  phoneticNote: string;
  expectedExamples: string[];
  /** Short candidate strings Whisper is likely to produce for this target sound. */
  transcriptionCandidates: string[];
  commonSubstitutions: string[];
  childFriendlyTips: string[];
  scoringHints: string[];
}

export const TARGET_SOUND_RUBRICS: Record<string, TargetSoundRubric> = {
  ก: {
    id: "ก",
    symbol: "ก",
    label: "กอ ไก่",
    phoneticNote: "unaspirated velar stop /k/ — ลิ้นส่วนหลังกดเพดานอ่อน ไม่มีลมพ่น",
    expectedExamples: ["ก", "กา", "กบ", "ไก่", "กล้วย", "กวาง", "กระต่าย"],
    transcriptionCandidates: ["ก", "กา", "กอ", "กอไก่", "กอ ไก่"],
    commonSubstitutions: ["ค", "ข", "เสียงออกมาอ่อนเกินไป", "ไม่ชัดที่ต้นคำ"],
    childFriendlyTips: [
      "เสียง ก ใกล้เคียงแล้ว ลองเริ่มเสียงให้ชัดขึ้นอีกนิด",
      "ลองออกเสียง ก แบบสั้นและชัด เหมือนคำว่า กา",
      "ทำได้ดีมาก ลองพูดอีกครั้งให้เสียงต้นคำชัดขึ้น",
    ],
    scoringHints: [
      "ถ้าได้ยิน /k/ ชัดไม่มีลมพ่น targetSoundScore สูง",
      "ถ้า transcript มีคำขึ้นต้น ก ถูกต้อง transcriptMatchScore สูง",
      "ถ้าเสียงอ่อนหรือไม่ชัด clarityScore ต่ำลง",
      "ถ้าได้ยินเสียงคล้าย ค ให้ตั้ง detectedIssues ว่า 'เสียงคล้าย ค มากกว่า ก'",
    ],
  },
  ค: {
    id: "ค",
    symbol: "ค",
    label: "คอ ควาย",
    phoneticNote: "aspirated velar stop /kʰ/ — ลิ้นส่วนหลังกดเพดานอ่อน มีลมพ่น",
    expectedExamples: ["ค", "คา", "ควาย", "ครู", "คน", "คอ"],
    transcriptionCandidates: ["ค", "คา", "คอ", "คอควาย", "คอ ควาย"],
    commonSubstitutions: ["ก", "ข", "เสียงไม่มีลมพ่น", "ออกเสียงเหมือน ก"],
    childFriendlyTips: [
      "ลองเติมลมหายใจเบาๆ ตอนเริ่มเสียง ค",
      "เสียงใกล้แล้ว ลองให้เสียง ค มีลมออกมานิดหนึ่ง",
      "ดีมาก ลองพูด คอ ควาย อีกครั้งให้ชัดขึ้น",
    ],
    scoringHints: [
      "ถ้าได้ยิน /kʰ/ พร้อมลมพ่น targetSoundScore สูง",
      "ถ้า transcript มีคำขึ้นต้น ค ถูกต้อง transcriptMatchScore สูง",
      "ถ้าไม่มีลมพ่นเลย ใกล้เคียง ก มากกว่า ให้ targetSoundScore ต่ำ",
      "ถ้าได้ยินเสียงคล้าย ก ให้ตั้ง detectedIssues ว่า 'เสียงขาดลม ใกล้เคียง ก'",
    ],
  },
  ต: {
    id: "ต",
    symbol: "ต",
    label: "ตอ เต่า",
    phoneticNote: "unaspirated dental stop /t/ — ปลายลิ้นแตะฟันหน้า ไม่มีลมพ่น",
    expectedExamples: ["ต", "ตา", "เต่า", "ตุ๊กตา", "ตลาด", "ตับ"],
    transcriptionCandidates: ["ต", "ตา", "ตอ", "ตอเต่า", "ตอ เต่า"],
    commonSubstitutions: ["ด", "ถ", "เสียงไม่ชัด", "ออกเสียงอ่อนเกินไป"],
    childFriendlyTips: [
      "ลองแตะปลายลิ้นด้านหน้าเบาๆ แล้วออกเสียง ต",
      "เสียงใกล้เคียงแล้ว ลองให้เสียงต้นคำชัดขึ้น",
      "ดีมาก ลองพูด ตา หรือ เต่า ให้ชัดอีกครั้ง",
    ],
    scoringHints: [
      "ถ้าได้ยิน /t/ ชัดไม่มีลมพ่น targetSoundScore สูง",
      "ถ้า transcript มีคำขึ้นต้น ต ถูกต้อง transcriptMatchScore สูง",
      "ถ้าเสียงคล้าย ด หรือ ถ ให้ targetSoundScore ต่ำลงและระบุ detectedIssues",
    ],
  },
  ช: {
    id: "ช",
    symbol: "ช",
    label: "ชอ ช้าง",
    phoneticNote: "palato-alveolar affricate /tɕʰ/ — ลิ้นยกใกล้เพดาน มีลมพ่น",
    expectedExamples: ["ช", "ชา", "ช้าง", "ชอบ", "ชน", "เช้า"],
    transcriptionCandidates: ["ช", "ชา", "ชอ", "ชอช้าง", "ชอ ช้าง"],
    commonSubstitutions: ["ซ", "จ", "ส", "เสียงไม่ชัด"],
    childFriendlyTips: [
      "ลองยิ้มเล็กน้อยแล้วออกเสียง ช ให้ชัด",
      "เสียงใกล้แล้ว ลองให้เสียง ช เริ่มชัดกว่านี้",
      "ทำได้ดีมาก ลองพูด ชา หรือ ช้าง อีกครั้งนะ",
    ],
    scoringHints: [
      "ถ้าได้ยิน /tɕʰ/ ชัด ไม่ใช่ ซ หรือ จ targetSoundScore สูง",
      "ถ้า transcript มีคำขึ้นต้น ช ถูกต้อง transcriptMatchScore สูง",
      "ถ้าเสียงคล้าย ซ ให้ targetSoundScore ต่ำ และ detectedIssues ระบุ 'เสียงคล้าย ซ'",
      "ถ้าเสียงคล้าย จ ให้ระบุ detectedIssues ว่า 'เสียงคล้าย จ มากกว่า ช'",
    ],
  },
};

export function getRubric(targetSound: string): TargetSoundRubric | undefined {
  return TARGET_SOUND_RUBRICS[targetSound];
}

export function getStageLabel(stageId: string): string {
  const map: Record<string, string> = {
    pretest: "Pre-test (ประเมินเสียงก่อนฝึก)",
    "level-1": "Level 1: Oral Motor",
    "level-2": "Level 2: Sound Familiarity (จดจำเสียง)",
    "level-3": "Level 3: Sound Production (ออกเสียงพยัญชนะ) — ให้น้ำหนัก targetSoundScore สูง",
    "level-4": "Level 4: Word Practice (ฝึกคำ)",
    "level-5": "Level 5: Sentence Practice (ฝึกประโยค)",
    review: "Review / Post-test (ประเมินหลังฝึก) — ใช้เกณฑ์เข้มกว่าปกติ",
  };
  return map[stageId] ?? stageId;
}
