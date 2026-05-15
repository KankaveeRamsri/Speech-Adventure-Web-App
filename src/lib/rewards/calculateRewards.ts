import type { SpeechProgress, PracticeAttempt, PracticeSession } from "@/types/speechAdventure";
import type { EarnedReward, RewardProgress, RewardCalculationResult } from "@/types/rewards";
import { BADGE_DEFINITIONS } from "./rewardDefinitions";
import { calculateProgressSummary, getStageStatus } from "@/lib/speechProgressStorage";

const STAGE_ORDER = ["pretest", "level-1", "level-2", "level-3", "level-4", "level-5", "review"];

function isStageCompleted(attempts: PracticeAttempt[], stageId: string): boolean {
  const status = getStageStatus(attempts, stageId);
  return status === "completed";
}

function lastAttemptInStage(attempts: PracticeAttempt[], stageId: string): string {
  const stageAttempts = attempts.filter((a) => a.stageId === stageId);
  if (stageAttempts.length === 0) return new Date().toISOString();
  return [...stageAttempts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0].createdAt;
}

function completedSessionCount(sessions: PracticeSession[]): number {
  return sessions.filter((s) => s.status === "completed").length;
}

function nthCompletedSessionDate(sessions: PracticeSession[], n: number): string {
  const completed = [...sessions.filter((s) => s.status === "completed")].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );
  return completed[n - 1]?.endedAt ?? new Date().toISOString();
}

export function calculateRewards(progress: SpeechProgress): RewardCalculationResult {
  const summary = calculateProgressSummary(progress);
  const { attempts, sessions } = progress;

  const earned: EarnedReward[] = [];
  const locked: RewardProgress[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    switch (badge.id) {
      case "first_practice": {
        if (attempts.length >= 1) {
          const sortedAsc = [...attempts].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          earned.push({ badge, earnedAt: sortedAsc[0].createdAt });
        } else {
          locked.push({ badge, current: 0, target: 1, percentage: 0, hint: "เริ่มฝึกภารกิจแรกได้เลย" });
        }
        break;
      }

      case "pretest_completed": {
        const pretestAttempts = attempts.filter((a) => a.stageId === "pretest");
        if (pretestAttempts.length >= 1) {
          const first = [...pretestAttempts].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];
          earned.push({ badge, earnedAt: first.createdAt });
        } else {
          locked.push({ badge, current: 0, target: 1, percentage: 0, hint: "ทำ Pre-test เพื่อเริ่มต้น" });
        }
        break;
      }

      case "level_starter": {
        if (isStageCompleted(attempts, "level-1")) {
          earned.push({ badge, earnedAt: lastAttemptInStage(attempts, "level-1") });
        } else {
          const lvl1 = attempts.filter((a) => a.stageId === "level-1").length;
          locked.push({ badge, current: Math.min(lvl1, 0), target: 1, percentage: lvl1 > 0 ? 50 : 0, hint: "ผ่าน Level 1: Oral Motor ให้สำเร็จ" });
        }
        break;
      }

      case "sound_explorer": {
        const numCompleted = STAGE_ORDER.filter((id) => isStageCompleted(attempts, id)).length;
        if (numCompleted >= 3) {
          const completedStageIds = STAGE_ORDER.filter((id) => isStageCompleted(attempts, id));
          const timestamps = completedStageIds.map((id) => lastAttemptInStage(attempts, id)).sort();
          earned.push({ badge, earnedAt: timestamps[2] ?? new Date().toISOString() });
        } else {
          locked.push({
            badge,
            current: numCompleted,
            target: 3,
            percentage: Math.round((numCompleted / 3) * 100),
            hint: `ผ่านอีก ${3 - numCompleted} ระดับ`,
          });
        }
        break;
      }

      case "word_builder": {
        if (isStageCompleted(attempts, "level-4")) {
          earned.push({ badge, earnedAt: lastAttemptInStage(attempts, "level-4") });
        } else {
          const lvl4 = attempts.filter((a) => a.stageId === "level-4").length;
          locked.push({ badge, current: Math.min(lvl4, 0), target: 1, percentage: lvl4 > 0 ? 50 : 0, hint: "ผ่าน Level 4: Word Practice ให้สำเร็จ" });
        }
        break;
      }

      case "sentence_speaker": {
        if (isStageCompleted(attempts, "level-5")) {
          earned.push({ badge, earnedAt: lastAttemptInStage(attempts, "level-5") });
        } else {
          const lvl5 = attempts.filter((a) => a.stageId === "level-5").length;
          locked.push({ badge, current: Math.min(lvl5, 0), target: 1, percentage: lvl5 > 0 ? 50 : 0, hint: "ผ่าน Level 5: Sentence Practice ให้สำเร็จ" });
        }
        break;
      }

      case "review_champion": {
        if (isStageCompleted(attempts, "review")) {
          earned.push({ badge, earnedAt: lastAttemptInStage(attempts, "review") });
        } else {
          locked.push({ badge, current: 0, target: 1, percentage: 0, hint: "ทำ Review / Post-test ให้เสร็จสมบูรณ์" });
        }
        break;
      }

      case "great_improvement": {
        if (summary.improvement > 0) {
          earned.push({ badge, earnedAt: lastAttemptInStage(attempts, "review") });
        } else if (summary.reviewScore > 0 && summary.pretestScore > 0) {
          locked.push({ badge, current: 0, target: 1, percentage: 0, hint: "คะแนน Review ต้องสูงกว่า Pre-test" });
        } else {
          locked.push({ badge, current: 0, target: 1, percentage: 0, hint: "ทำ Pre-test และ Review ให้ครบก่อน" });
        }
        break;
      }

      case "consistent_learner": {
        const completedCount = completedSessionCount(sessions);
        if (completedCount >= 3) {
          earned.push({ badge, earnedAt: nthCompletedSessionDate(sessions, 3) });
        } else {
          locked.push({
            badge,
            current: completedCount,
            target: 3,
            percentage: Math.round((completedCount / 3) * 100),
            hint: `ทำเซสชันให้ครบ ${3 - completedCount} เซสชันเพิ่ม`,
          });
        }
        break;
      }

      case "star_collector": {
        const stars = summary.starsEarned;
        if (stars >= 30) {
          // Find the attempt that brought stars to 30
          const sortedAttempts = [...attempts].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          let runningStars = 0;
          let earnedAt = new Date().toISOString();
          for (const a of sortedAttempts) {
            runningStars += a.starsEarned;
            if (runningStars >= 30) {
              earnedAt = a.createdAt;
              break;
            }
          }
          earned.push({ badge, earnedAt });
        } else {
          locked.push({
            badge,
            current: stars,
            target: 30,
            percentage: Math.round(Math.min((stars / 30) * 100, 99)),
            hint: `สะสมดาวอีก ${30 - stars} ดวง`,
          });
        }
        break;
      }
    }
  }

  earned.sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentAchievements = earned.filter(
    (e) => new Date(e.earnedAt) >= sevenDaysAgo
  );

  return {
    earned,
    locked,
    recentAchievements,
    totalBadges: BADGE_DEFINITIONS.length,
    earnedCount: earned.length,
  };
}
