/**
 * Ambient 3D background for the landing page.
 *
 * Render this as the FIRST child of a `relative isolate` parent.
 * `absolute inset-0 -z-10` keeps it behind all siblings within the
 * isolated stacking context, while remaining above the body background.
 *
 * Desktop: multi-layered orbs + radial glow + dot grid
 * Mobile: single radial glow only (performance-safe)
 */
export default function HomeBackground() {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Top radial glow — primary violet emanating from above */}
      <div className="absolute inset-x-0 -top-40 h-[75vh] home-glow-top" />

      {/* ── Ambient orbs — sm+ only ── */}

      {/* Orb A: violet — top-left quadrant, slow drift */}
      <div
        className="hidden sm:block absolute -top-16 -left-40
          w-[520px] h-[520px] rounded-full
          bg-violet-500/[0.055] dark:bg-violet-500/10
          blur-[110px] animate-orb-a"
      />

      {/* Orb B: indigo — center-right, mid-page depth */}
      <div
        className="hidden sm:block absolute top-[38%] -right-48
          w-[460px] h-[460px] rounded-full
          bg-indigo-500/[0.045] dark:bg-indigo-500/[0.09]
          blur-[100px] animate-orb-b"
      />

      {/* Orb C: emerald accent — lower-left (md+) */}
      <div
        className="hidden md:block absolute bottom-[20%] -left-24
          w-[380px] h-[380px] rounded-full
          bg-emerald-500/[0.032] dark:bg-emerald-500/[0.065]
          blur-[90px]"
      />

      {/* Orb D: soft violet — lower-right (lg+) */}
      <div
        className="hidden lg:block absolute bottom-[10%] right-[4%]
          w-[340px] h-[340px] rounded-full
          bg-violet-400/[0.028] dark:bg-violet-400/[0.055]
          blur-[85px] animate-orb-b"
      />

      {/* ── Mobile: single simplified glow, no blur blobs ── */}
      <div className="sm:hidden absolute inset-x-0 top-0 h-[55vh] home-glow-mobile" />

      {/* ── Dot grid texture — very subtle ── */}
      <svg
        className="absolute inset-0 w-full h-full text-primary opacity-[0.018] dark:opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="home-ambient-dots"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#home-ambient-dots)" />
      </svg>
    </div>
  );
}
