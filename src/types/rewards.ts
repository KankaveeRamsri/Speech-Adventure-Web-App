export type BadgeCategory = "practice" | "stage" | "achievement" | "collection";

export interface RewardBadge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  color: string;
  iconPath: string;
}

export interface EarnedReward {
  badge: RewardBadge;
  earnedAt: string;
}

export interface RewardProgress {
  badge: RewardBadge;
  current: number;
  target: number;
  percentage: number;
  hint: string;
}

export interface RewardCalculationResult {
  earned: EarnedReward[];
  locked: RewardProgress[];
  recentAchievements: EarnedReward[];
  totalBadges: number;
  earnedCount: number;
}
