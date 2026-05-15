interface Props {
  headline: string;
  details: string[];
  strengths: string[];
  recommendation: string;
  reportDate?: string;
  isMock?: boolean;
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ReportSummaryCard({
  headline,
  details,
  strengths,
  recommendation,
  reportDate,
  isMock = true,
}: Props) {
  return (
    <div
      className="bg-surface border border-primary/15 rounded-2xl p-5 print:border-gray-200 print:rounded-lg print:p-4"
      style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.03) 0%, transparent 60%)" }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-border print:border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 print:hidden">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-text print:text-black">สรุปสำหรับผู้ปกครองและครู</h3>
          {reportDate && (
            <p className="text-xs text-text-muted print:text-gray-400">ข้อมูล ณ {reportDate}</p>
          )}
        </div>
      </div>

      {/* Headline */}
      <div className="bg-bg dark:bg-white/4 border border-border rounded-xl p-4 mb-4 print:bg-gray-50 print:border-gray-200">
        <p className="font-semibold text-text print:text-black">{headline}</p>
      </div>

      {/* Details */}
      {details.length > 0 && (
        <ul className="space-y-2 mb-4">
          {details.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text print:text-black">
              <span className="text-primary flex-shrink-0 mt-0.5 font-bold print:text-gray-500">·</span>
              {d}
            </li>
          ))}
        </ul>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-success uppercase tracking-wide mb-2 print:text-green-700">
            จุดแข็ง
          </p>
          <ul className="space-y-1.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text text-success print:text-green-800">
                <CheckIcon />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-primary/8 border border-primary/15 rounded-xl p-4 print:bg-blue-50 print:border-blue-100">
        <p className="text-xs font-bold text-primary mb-1.5 print:text-blue-700">คำแนะนำ</p>
        <p className="text-sm text-text leading-relaxed print:text-black">{recommendation}</p>
      </div>

      {isMock && (
        <p className="text-xs text-text-muted text-center mt-4 print:text-gray-400">
          * ผลประเมินนี้เป็นข้อมูลสาธิต (Mock Evaluation) ระบบ AI วิเคราะห์เสียงจริงยังอยู่ระหว่างพัฒนา
        </p>
      )}
    </div>
  );
}
