import type { ChildProfile } from "@/types/speechAdventure";

interface Props {
  profile: ChildProfile;
  compact?: boolean;
  /** Pass isHydrated from useSpeechProgress() so localStorage-derived values
   *  show a stable placeholder ("—") on server and during hydration, preventing
   *  React hydration mismatches. Defaults to true (show real data). */
  isHydrated?: boolean;
  /** Average score (0-100) for the full profile card. Pass from summary. */
  averageScore?: number;
}

export default function ChildProfileCard({
  profile,
  compact = false,
  isHydrated = true,
  averageScore,
}: Props) {
  const stars = isHydrated ? `⭐ ${profile.totalStars}` : "⭐ —";
  const attempts = isHydrated ? profile.totalAttempts : "—";
  const scoreDisplay =
    isHydrated && averageScore !== undefined ? `${averageScore}%` : "—";

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3 shadow-sm">
        <span className="text-3xl" aria-hidden="true">
          {profile.avatarEmoji}
        </span>
        <div>
          <p className="font-semibold text-text">{profile.nickname}</p>
          <p className="text-sm text-text-muted">อายุ {profile.age} ปี</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-secondary font-semibold">
          {stars}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl" aria-hidden="true">
          {profile.avatarEmoji}
        </span>
        <div>
          <h2 className="text-xl font-bold text-text">{profile.name}</h2>
          <p className="text-text-muted">
            ชื่อเล่น: {profile.nickname} · อายุ {profile.age} ปี
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-secondary">{stars}</p>
          <p className="text-xs text-text-muted mt-1">ดาวที่ได้</p>
        </div>
        <div className="bg-bg rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{attempts}</p>
          <p className="text-xs text-text-muted mt-1">ครั้งที่ฝึก</p>
        </div>
        <div className="bg-bg rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-success">{scoreDisplay}</p>
          <p className="text-xs text-text-muted mt-1">ความแม่นยำ</p>
        </div>
      </div>
    </div>
  );
}
