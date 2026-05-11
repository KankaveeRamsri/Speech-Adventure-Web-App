import type { ChildProfile } from "@/types/speechAdventure";

interface Props {
  profile: ChildProfile;
  compact?: boolean;
}

export default function ChildProfileCard({ profile, compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3 shadow-sm">
        <span className="text-3xl" aria-hidden="true">{profile.avatarEmoji}</span>
        <div>
          <p className="font-semibold text-text">{profile.nickname}</p>
          <p className="text-sm text-text-muted">อายุ {profile.age} ปี</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-secondary font-semibold">
          ⭐ {profile.totalStars}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl" aria-hidden="true">{profile.avatarEmoji}</span>
        <div>
          <h2 className="text-xl font-bold text-text">{profile.name}</h2>
          <p className="text-text-muted">ชื่อเล่น: {profile.nickname} · อายุ {profile.age} ปี</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-secondary">⭐ {profile.totalStars}</p>
          <p className="text-xs text-text-muted mt-1">ดาวที่ได้</p>
        </div>
        <div className="bg-bg rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{profile.totalAttempts}</p>
          <p className="text-xs text-text-muted mt-1">ครั้งที่ฝึก</p>
        </div>
        <div className="bg-bg rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-success">72%</p>
          <p className="text-xs text-text-muted mt-1">ความแม่นยำ</p>
        </div>
      </div>
    </div>
  );
}
