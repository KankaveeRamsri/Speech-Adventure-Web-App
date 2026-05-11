interface Props {
  stars: number;
  message: string;
}

export default function RewardBadge({ stars, message }: Props) {
  return (
    <div className="bg-gradient-to-b from-secondary/20 to-secondary/5 rounded-3xl p-8 text-center">
      <div className="text-5xl mb-3 animate-bounce-in" aria-hidden="true">🏆</div>
      <div className="flex justify-center gap-2 mb-3">
        {Array.from({ length: stars }).map((_, i) => (
          <span
            key={i}
            className="text-3xl text-secondary animate-bounce-in"
            style={{ animationDelay: `${i * 0.15}s` }}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </div>
      <p className="text-xl font-bold text-text">{message}</p>
      <p className="text-sm text-text-muted mt-1">ได้รับ {stars} ดาว!</p>
    </div>
  );
}
