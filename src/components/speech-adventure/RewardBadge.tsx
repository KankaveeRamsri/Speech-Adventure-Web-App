interface Props {
  stars: number;
  message: string;
}

export default function RewardBadge({ stars, message }: Props) {
  return (
    <div className="bg-gradient-to-br from-secondary/15 via-surface to-secondary/5 border border-secondary/20 rounded-xl p-8 text-center">
      {/* Star display */}
      <div className="flex justify-center gap-2 mb-4" aria-label={`ได้รับ ${stars} ดาว`}>
        {Array.from({ length: stars }).map((_, i) => (
          <span
            key={i}
            className="text-4xl text-secondary animate-bounce-in leading-none"
            style={{ animationDelay: `${i * 0.12}s` }}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
        {Array.from({ length: Math.max(0, 3 - stars) }).map((_, i) => (
          <span key={i + stars} className="text-4xl text-disabled dark:text-white/15 leading-none" aria-hidden="true">
            ★
          </span>
        ))}
      </div>

      <p className="text-lg font-bold text-text mb-1">{message}</p>
      <p className="text-sm text-text-muted">
        ได้รับ <span className="font-semibold text-secondary">{stars}</span> ดาวในภารกิจนี้
      </p>
    </div>
  );
}
