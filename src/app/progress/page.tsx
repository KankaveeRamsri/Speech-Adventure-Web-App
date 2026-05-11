import Link from "next/link";
import ChildProfileCard from "@/components/speech-adventure/ChildProfileCard";
import ProgressSummary from "@/components/speech-adventure/ProgressSummary";
import {
  mockChildProfile,
  mockProgressSummary,
  mockPracticeHistory,
  mockTrainingStages,
} from "@/data/speechAdventureMockData";

export default function ProgressDashboardPage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Top Bar */}
      <nav className="sticky top-0 z-20 bg-surface/90 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
            aria-label="กลับหน้าแรก"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium hidden sm:inline">กลับ</span>
          </Link>
          <h1 className="font-bold text-text">📊 ความก้าวหน้า</h1>
          <Link
            href="/training"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            🗺️ แผนที่การฝึก
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-text">สรุปความก้าวหน้า</h2>
          <p className="text-sm text-text-muted">สำหรับผู้ปกครองและคุณครู</p>
        </div>

        {/* Child Profile */}
        <ChildProfileCard profile={mockChildProfile} />

        {/* Progress Summary */}
        <ProgressSummary summary={mockProgressSummary} />

        {/* Stage Progress */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text mb-4">📍 ความคืบหน้าในแต่ละระดับ</h3>
          <div className="space-y-3">
            {mockTrainingStages.map((stage) => {
              const percent = stage.starsTotal > 0
                ? Math.round((stage.starsEarned / stage.starsTotal) * 100)
                : 0;

              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center" aria-hidden="true">
                    {stage.status === "locked" ? "🔒" : stage.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text truncate">
                        {stage.name}
                      </span>
                      <span className="text-xs text-text-muted ml-2 flex-shrink-0">
                        {stage.starsEarned}/{stage.starsTotal} ⭐
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: stage.status === "locked" ? "#B2BEC3" : stage.accentColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Practice History */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text mb-4">📝 ประวัติการฝึกล่าสุด</h3>
          <div className="space-y-3">
            {mockPracticeHistory.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 bg-bg rounded-2xl p-4"
              >
                {/* Status Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    record.isPassed ? "bg-success/15" : "bg-error/15"
                  }`}
                  aria-hidden="true"
                >
                  {record.isPassed ? "✅" : "🔄"}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-text text-sm">
                      {record.target}
                    </p>
                    <div className="flex items-center gap-0.5 text-secondary text-sm ml-2 flex-shrink-0">
                      {"★".repeat(record.stars)}
                      <span className="text-text-muted text-xs ml-1">
                        ({record.score}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {record.stageName} · {record.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Training CTA */}
        <div className="text-center pt-4 pb-8">
          <Link
            href="/training"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            🗺️ กลับไปฝึกต่อ
          </Link>
        </div>
      </div>
    </main>
  );
}
