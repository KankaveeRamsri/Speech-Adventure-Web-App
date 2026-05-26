"use client";

/**
 * PermissionBanner
 *
 * A compact, inline notice shown when a UI action is hidden or disabled
 * due to insufficient child_access permissions.
 *
 * Usage:
 *   <PermissionBanner message="คุณมีสิทธิ์ดูเท่านั้น" />
 *   <PermissionBanner message="ต้องได้รับสิทธิ์จากผู้ดูแลเด็ก" hint="ติดต่อเจ้าของโปรไฟล์" />
 */

interface PermissionBannerProps {
  message: string;
  hint?: string;
  className?: string;
}

export default function PermissionBanner({
  message,
  hint,
  className = "",
}: PermissionBannerProps) {
  return (
    <div
      className={`flex items-start gap-2.5 bg-border/30 dark:bg-white/5 border border-border rounded-xl px-4 py-3 ${className}`}
      role="note"
      aria-label={message}
    >
      {/* Lock icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 text-text-muted mt-0.5"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-muted">{message}</p>
        {hint && (
          <p className="text-xs text-text-muted/70 mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  );
}
