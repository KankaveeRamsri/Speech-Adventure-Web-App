/** TrainingJourneySection — Visual timeline of all 6 training stages */

const stages = [
  {
    num: 1,
    key: "pretest",
    name: "Pre-test",
    nameTh: "ประเมินเบื้องต้น",
    desc: "วัดระดับการออกเสียงปัจจุบัน เพื่อกำหนดจุดเริ่มต้นที่เหมาะสม",
    color: "bg-level-pretest",
    textColor: "text-level-pretest",
    borderColor: "border-level-pretest/30",
    bgLight: "bg-level-pretest/8",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    num: 2,
    key: "oral",
    name: "Oral Motor",
    nameTh: "ฝึกกล้ามเนื้อปาก",
    desc: "เสริมสร้างกล้ามเนื้อช่องปากและลิ้น พื้นฐานสำคัญของการออกเสียง",
    color: "bg-level-oral",
    textColor: "text-level-oral",
    borderColor: "border-level-oral/30",
    bgLight: "bg-level-oral/8",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" x2="9.01" y1="9" y2="9" />
        <line x1="15" x2="15.01" y1="9" y2="9" />
      </svg>
    ),
  },
  {
    num: 3,
    key: "soundfam",
    name: "Sound Familiarity",
    nameTh: "จดจำเสียงพยัญชนะ",
    desc: "ฟังและแยกแยะเสียงพยัญชนะเป้าหมาย ก่อนเริ่มฝึกออกเสียงจริง",
    color: "bg-level-sound-fam",
    textColor: "text-level-sound-fam",
    borderColor: "border-level-sound-fam/30",
    bgLight: "bg-level-sound-fam/8",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    num: 4,
    key: "soundprod",
    name: "Sound Production",
    nameTh: "ฝึกออกเสียง",
    desc: "ฝึกออกเสียงพยัญชนะเดี่ยว พร้อมฟัง Feedback จากระบบ AI",
    color: "bg-level-sound-prod",
    textColor: "text-level-sound-prod",
    borderColor: "border-level-sound-prod/30",
    bgLight: "bg-level-sound-prod/8",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    ),
  },
  {
    num: 5,
    key: "word",
    name: "Word Practice",
    nameTh: "ฝึกออกเสียงคำ",
    desc: "นำเสียงที่ฝึกมาใส่ในบริบทของคำศัพท์ที่ใช้ในชีวิตประจำวัน",
    color: "bg-level-word",
    textColor: "text-level-word",
    borderColor: "border-level-word/30",
    bgLight: "bg-level-word/8",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    num: 6,
    key: "sentence",
    name: "Sentence Practice",
    nameTh: "ฝึกออกเสียงประโยค",
    desc: "ประยุกต์ใช้ในประโยคสมบูรณ์ เพื่อพัฒนาการสื่อสารในชีวิตจริง",
    color: "bg-level-sentence",
    textColor: "text-level-sentence",
    borderColor: "border-level-sentence/30",
    bgLight: "bg-level-sentence/8",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function TrainingJourneySection() {
  return (
    <section className="mt-24" aria-labelledby="journey-heading">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-level-sentence/8 border border-level-sentence/20 rounded-full px-4 py-1.5 mb-4 text-sm font-medium text-level-sentence">
          เส้นทางการฝึก
        </div>
        <h2 id="journey-heading" className="text-2xl md:text-3xl font-bold text-text mb-3">
          6 ระดับ สู่การพูดที่ชัดเจน
        </h2>
        <p className="text-text-muted max-w-md mx-auto leading-relaxed">
          หลักสูตรที่ได้แรงบันดาลใจจากแนวปฏิบัติการบำบัดการพูด (Speech Therapy)
          ออกแบบให้เหมาะกับเด็กไทย
        </p>
      </div>

      {/* Desktop: horizontal timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress bar background */}
          <div className="absolute top-8 left-8 right-8 h-1 bg-border rounded-full" aria-hidden="true" />
          {/* Progress bar fill (mock: 3 of 6 done) */}
          <div className="absolute top-8 left-8 h-1 w-[41%] bg-gradient-to-r from-level-pretest via-level-oral to-level-sound-fam rounded-full" aria-hidden="true" />

          <div className="grid grid-cols-6 gap-3 relative z-10">
            {stages.map((stage, i) => (
              <div key={stage.key} className="flex flex-col items-center group">
                {/* Circle */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white mb-4 shadow-md stage-circle-3d ${stage.color}`}
                  aria-label={`ขั้นตอนที่ ${stage.num}: ${stage.name}`}
                >
                  {stage.icon}
                </div>
                {/* Text */}
                <p className={`text-xs font-bold mb-0.5 text-center leading-tight ${stage.textColor}`}>
                  {stage.name}
                </p>
                <p className="text-[11px] text-text-muted text-center leading-tight">
                  {stage.nameTh}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Description cards */}
        <div className="grid grid-cols-6 gap-3 mt-4">
          {stages.map((stage) => (
            <div
              key={`desc-${stage.key}`}
              className={`rounded-xl border p-3 card-3d ${stage.bgLight} ${stage.borderColor}`}
            >
              <p className="text-[11px] text-text-muted leading-relaxed">{stage.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden space-y-3">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className={`flex items-start gap-4 bg-surface border ${stage.borderColor} rounded-2xl px-4 py-4 feature-item-3d`}
          >
            {/* Icon circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${stage.color}`}
              aria-label={stage.name}
            >
              {stage.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-bold text-sm ${stage.textColor}`}>{stage.name}</p>
                <span className="text-xs text-text-muted">· {stage.nameTh}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{stage.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
