"use client";

import AppShell from "@/components/layout/AppShell";
import CloudSyncPreview from "@/components/sync/CloudSyncPreview";

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-text">{title}</h2>
      {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-text">ตั้งค่า</h1>
          <p className="text-sm text-text-muted mt-1">จัดการข้อมูลและการเชื่อมต่อ Cloud</p>
        </div>

        {/* Cloud sync section */}
        <section aria-labelledby="sync-section-title">
          <SectionHeader
            title="ซิงค์ข้อมูลไปยัง Cloud"
            description="แสดงตัวอย่างการย้ายข้อมูลจากอุปกรณ์นี้ไปยัง Supabase — ยังไม่มีการเปลี่ยนแปลงข้อมูลจริง"
          />
          <div className="bg-surface border border-border rounded-xl p-5">
            <CloudSyncPreview />
          </div>
        </section>

        {/* App info section */}
        <section aria-labelledby="about-section-title">
          <SectionHeader title="เกี่ยวกับแอป" />
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-muted">เวอร์ชัน</span>
              <span className="text-sm font-medium text-text">0.1.0 · Prototype</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-muted">ข้อมูลจัดเก็บที่</span>
              <span className="text-sm font-medium text-text">localStorage</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-muted">Storage Provider</span>
              <span className="text-sm font-mono text-text-muted bg-border/40 px-2 py-0.5 rounded">
                {process.env.NEXT_PUBLIC_STORAGE_PROVIDER ?? "local"}
              </span>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
