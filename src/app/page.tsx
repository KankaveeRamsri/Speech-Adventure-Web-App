import HeroSection from "@/components/speech-adventure/HeroSection";
import Link from "next/link";

export default function LandingPage() {
  const journeySteps = [
    { icon: "📋", name: "Pre-test", desc: "ประเมินเสียงเริ่มต้น" },
    { icon: "👄", name: "Oral Motor", desc: "ฝึกกล้ามเนื้อช่องปาก" },
    { icon: "👂", name: "Sound Familiarity", desc: "จดจำเสียงพยัญชนะ" },
    { icon: "🗣️", name: "Sound Production", desc: "ฝึกออกเสียง" },
    { icon: "📖", name: "Word Practice", desc: "ฝึกออกเสียงคำ" },
    { icon: "💬", name: "Sentence Practice", desc: "ฝึกออกเสียงประโยค" },
    { icon: "🏆", name: "Review", desc: "ทบทวนและประเมินผล" },
  ];

  return (
    <main className="min-h-screen">
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🗣️</span>
          <span className="font-bold text-lg text-primary">Speech Adventure</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/training"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            เริ่มฝึก
          </Link>
          <Link
            href="/progress"
            className="text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            ความก้าวหน้า
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        {/* Hero */}
        <HeroSection />

        {/* Journey Overview */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-text mb-2 text-center">
            เส้นทางการฝึกฝน
          </h2>
          <p className="text-text-muted text-center mb-8 max-w-lg mx-auto">
            น้องๆ จะได้เดินทางผ่าน 7 ขั้นตอน จากการประเมินเบื้องต้น ไปจนถึงการฝึกประโยค
            พร้อมรับดาวและรางวัลไปตลอดทาง!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {journeySteps.map((step, i) => (
              <div
                key={step.name}
                className="bg-surface rounded-2xl p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <span className="text-3xl block mb-2" aria-hidden="true">{step.icon}</span>
                <p className="font-semibold text-sm text-text">{step.name}</p>
                <p className="text-xs text-text-muted mt-1">{step.desc}</p>
                {i < journeySteps.length - 1 && (
                  <span className="hidden lg:block text-gray-300 mt-2 text-lg" aria-hidden="true">→</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-text mb-8 text-center">
            ทำไมต้อง Speech Adventure?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎮",
                title: "สนุกเหมือนเล่นเกม",
                desc: "ระบบรางวัล ดาว และ Badge ทำให้น้องๆ สนุกกับการฝึกทุกวัน",
              },
              {
                icon: "📈",
                title: "ติดตามความก้าวหน้า",
                desc: "ผู้ปกครองและคุณครูสามารถดูพัฒนาการได้อย่างชัดเจน",
              },
              {
                icon: "🤖",
                title: "AI ประเมินผล (เร็วๆ นี้)",
                desc: "ระบบ AI จะช่วยวิเคราะห์เสียงและให้ Feedback แบบ Real-time",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-surface rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <span className="text-4xl block mb-3" aria-hidden="true">{feature.icon}</span>
                <h3 className="font-bold text-text mb-2">{feature.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI Notice */}
        <section className="mt-12">
          <div className="bg-info/10 border border-info/20 rounded-2xl p-5 text-center">
            <p className="text-sm text-info font-medium">
              💡 <strong>หมายเหตุ:</strong> เวอร์ชันนี้เป็น Prototype UI
              ระบบ AI สำหรับประเมินผลเสียงจะถูกเพิ่มเข้ามาในเฟสถัดไป
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <Link
            href="/training"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            🚀 เริ่มการผจญภัยฝึกการพูด
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-surface border-t border-gray-100 py-6 text-center">
        <p className="text-sm text-text-muted">
          Speech Adventure — ผจญภัยฝึกการพูด · Prototype v1.0
        </p>
      </footer>
    </main>
  );
}
