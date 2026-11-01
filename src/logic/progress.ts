import type { Difficulty } from "../data/difficulty";

export const PROGRESS_VERSION = 1;
export const MAX_RUN_HISTORY = 30;

export type RunEndReason = "time" | "lives" | "ingredients";

export type AchievementId =
  | "first-brew"
  | "apprentice"
  | "journeyman"
  | "hard-scorer"
  | "survivor"
  | "reaction-adept"
  | "streak-three"
  | "stock-saver"
  | "high-score"
  | "dedicated";

export type UnlockId =
  "theme-night-lab" | "theme-parchment" | "codex-reactions";

export interface RunRecord {
  playedAt: number;
  difficulty: Difficulty;
  score: number;
  successfulBrews: number;
  failedBrews: number;
  reactionsFired: number;
  bestSuccessStreak: number;
  livesLeft: number;
  timeLeft: number;
  stockLeft: number;
  reason: RunEndReason;
}

export interface AchievementUnlock {
  id: AchievementId;
  unlockedAt: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  totalSuccessfulBrews: number;
  totalFailedBrews: number;
  totalReactionsFired: number;
  bestScore: number;
  bestScoreByDifficulty: Record<Difficulty, number>;
  bestSuccessStreak: number;
}

export interface PlayerProgress {
  version: number;
  runs: RunRecord[];
  stats: PlayerStats;
  achievements: AchievementUnlock[];
  unlocks: UnlockId[];
}

export interface RunSnapshot {
  difficulty: Difficulty;
  score: number;
  successfulBrews: number;
  failedBrews: number;
  reactionsFired: number;
  bestSuccessStreak: number;
  livesLeft: number;
  timeLeft: number;
  stockLeft: number;
  reason: RunEndReason;
  playedAt?: number;
}

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  unlockId?: UnlockId;
  isComplete: (progress: PlayerProgress, run: RunRecord) => boolean;
}

export interface ProgressUpdate {
  progress: PlayerProgress;
  newlyUnlocked: AchievementId[];
}

export function createEmptyStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    totalScore: 0,
    totalSuccessfulBrews: 0,
    totalFailedBrews: 0,
    totalReactionsFired: 0,
    bestScore: 0,
    bestScoreByDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    bestSuccessStreak: 0,
  };
}

export function createEmptyProgress(): PlayerProgress {
  return {
    version: PROGRESS_VERSION,
    runs: [],
    stats: createEmptyStats(),
    achievements: [],
    unlocks: [],
  };
}

export function stockLeftTotal(shelfStock: Record<string, number>): number {
  let total = 0;
  for (const amount of Object.values(shelfStock)) {
    total += amount;
  }
  return total;
}

export function buildRunRecord(snapshot: RunSnapshot): RunRecord {
  return {
    playedAt: snapshot.playedAt ?? Date.now(),
    difficulty: snapshot.difficulty,
    score: snapshot.score,
    successfulBrews: snapshot.successfulBrews,
    failedBrews: snapshot.failedBrews,
    reactionsFired: snapshot.reactionsFired,
    bestSuccessStreak: snapshot.bestSuccessStreak,
    livesLeft: snapshot.livesLeft,
    timeLeft: snapshot.timeLeft,
    stockLeft: snapshot.stockLeft,
    reason: snapshot.reason,
  };
}

function withRunStats(stats: PlayerStats, run: RunRecord): PlayerStats {
  const bestForDifficulty = Math.max(
    stats.bestScoreByDifficulty[run.difficulty],
    run.score,
  );

  return {
    gamesPlayed: stats.gamesPlayed + 1,
    totalScore: stats.totalScore + run.score,
    totalSuccessfulBrews: stats.totalSuccessfulBrews + run.successfulBrews,
    totalFailedBrews: stats.totalFailedBrews + run.failedBrews,
    totalReactionsFired: stats.totalReactionsFired + run.reactionsFired,
    bestScore: Math.max(stats.bestScore, run.score),
    bestScoreByDifficulty: {
      ...stats.bestScoreByDifficulty,
      [run.difficulty]: bestForDifficulty,
    },
    bestSuccessStreak: Math.max(stats.bestSuccessStreak, run.bestSuccessStreak),
  };
}

export function applyRun(
  progress: PlayerProgress,
  run: RunRecord,
  catalog: readonly AchievementDefinition[],
): ProgressUpdate {
  const next: PlayerProgress = {
    ...progress,
    version: PROGRESS_VERSION,
    runs: [run, ...progress.runs].slice(0, MAX_RUN_HISTORY),
    stats: withRunStats(progress.stats, run),
    achievements: [...progress.achievements],
    unlocks: [...progress.unlocks],
  };

  const owned = new Set(next.achievements.map((item) => item.id));
  const unlocks = new Set(next.unlocks);
  const newlyUnlocked: AchievementId[] = [];

  for (const achievement of catalog) {
    if (owned.has(achievement.id)) {
      continue;
    }

    if (!achievement.isComplete(next, run)) {
      continue;
    }

    next.achievements.push({
      id: achievement.id,
      unlockedAt: run.playedAt,
    });
    owned.add(achievement.id);
    newlyUnlocked.push(achievement.id);

    if (achievement.unlockId && !unlocks.has(achievement.unlockId)) {
      next.unlocks.push(achievement.unlockId);
      unlocks.add(achievement.unlockId);
    }
  }

  return { progress: next, newlyUnlocked };
}

export function hasAchievement(
  progress: PlayerProgress,
  id: AchievementId,
): boolean {
  return progress.achievements.some((item) => item.id === id);
}

export function hasUnlock(progress: PlayerProgress, id: UnlockId): boolean {
  return progress.unlocks.includes(id);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function isRunEndReason(value: unknown): value is RunEndReason {
  return value === "time" || value === "lives" || value === "ingredients";
}

function isAchievementId(value: unknown): value is AchievementId {
  return (
    value === "first-brew" ||
    value === "apprentice" ||
    value === "journeyman" ||
    value === "hard-scorer" ||
    value === "survivor" ||
    value === "reaction-adept" ||
    value === "streak-three" ||
    value === "stock-saver" ||
    value === "high-score" ||
    value === "dedicated"
  );
}

function isUnlockId(value: unknown): value is UnlockId {
  return (
    value === "theme-night-lab" ||
    value === "theme-parchment" ||
    value === "codex-reactions"
  );
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRun(value: unknown): RunRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonNegativeInt(value.playedAt) ||
    !isDifficulty(value.difficulty) ||
    !isNonNegativeInt(value.score) ||
    !isNonNegativeInt(value.successfulBrews) ||
    !isNonNegativeInt(value.failedBrews) ||
    !isNonNegativeInt(value.reactionsFired) ||
    !isNonNegativeInt(value.bestSuccessStreak) ||
    !isNonNegativeInt(value.livesLeft) ||
    typeof value.timeLeft !== "number" ||
    !Number.isFinite(value.timeLeft) ||
    value.timeLeft < 0 ||
    !isNonNegativeInt(value.stockLeft) ||
    !isRunEndReason(value.reason)
  ) {
    return null;
  }

  return {
    playedAt: value.playedAt,
    difficulty: value.difficulty,
    score: value.score,
    successfulBrews: value.successfulBrews,
    failedBrews: value.failedBrews,
    reactionsFired: value.reactionsFired,
    bestSuccessStreak: value.bestSuccessStreak,
    livesLeft: value.livesLeft,
    timeLeft: value.timeLeft,
    stockLeft: value.stockLeft,
    reason: value.reason,
  };
}

function parseStats(value: unknown): PlayerStats | null {
  if (!isRecord(value) || !isRecord(value.bestScoreByDifficulty)) {
    return null;
  }

  const byDifficulty = value.bestScoreByDifficulty;
  if (
    !isNonNegativeInt(value.gamesPlayed) ||
    !isNonNegativeInt(value.totalScore) ||
    !isNonNegativeInt(value.totalSuccessfulBrews) ||
    !isNonNegativeInt(value.totalFailedBrews) ||
    !isNonNegativeInt(value.totalReactionsFired) ||
    !isNonNegativeInt(value.bestScore) ||
    !isNonNegativeInt(value.bestSuccessStreak) ||
    !isNonNegativeInt(byDifficulty.easy) ||
    !isNonNegativeInt(byDifficulty.medium) ||
    !isNonNegativeInt(byDifficulty.hard)
  ) {
    return null;
  }

  return {
    gamesPlayed: value.gamesPlayed,
    totalScore: value.totalScore,
    totalSuccessfulBrews: value.totalSuccessfulBrews,
    totalFailedBrews: value.totalFailedBrews,
    totalReactionsFired: value.totalReactionsFired,
    bestScore: value.bestScore,
    bestScoreByDifficulty: {
      easy: byDifficulty.easy,
      medium: byDifficulty.medium,
      hard: byDifficulty.hard,
    },
    bestSuccessStreak: value.bestSuccessStreak,
  };
}

export function isValidProgress(data: unknown): PlayerProgress | null {
  if (!isRecord(data) || data.version !== PROGRESS_VERSION) {
    return null;
  }

  if (
    !Array.isArray(data.runs) ||
    !Array.isArray(data.achievements) ||
    !Array.isArray(data.unlocks)
  ) {
    return null;
  }

  const stats = parseStats(data.stats);
  if (!stats) {
    return null;
  }

  const runs: RunRecord[] = [];
  for (const value of data.runs.slice(0, MAX_RUN_HISTORY)) {
    const run = parseRun(value);
    if (!run) {
      return null;
    }
    runs.push(run);
  }

  const achievements: AchievementUnlock[] = [];
  const seenAchievements = new Set<AchievementId>();
  for (const value of data.achievements) {
    if (
      !isRecord(value) ||
      !isAchievementId(value.id) ||
      !isNonNegativeInt(value.unlockedAt)
    ) {
      return null;
    }
    if (seenAchievements.has(value.id)) {
      continue;
    }
    seenAchievements.add(value.id);
    achievements.push({ id: value.id, unlockedAt: value.unlockedAt });
  }

  const unlocks: UnlockId[] = [];
  const seenUnlocks = new Set<UnlockId>();
  for (const value of data.unlocks) {
    if (!isUnlockId(value)) {
      return null;
    }
    if (seenUnlocks.has(value)) {
      continue;
    }
    seenUnlocks.add(value);
    unlocks.push(value);
  }

  return {
    version: PROGRESS_VERSION,
    runs,
    stats,
    achievements,
    unlocks,
  };
}
