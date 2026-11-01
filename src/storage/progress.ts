import { ACHIEVEMENTS } from "../data/achievements";
import {
  applyRun,
  buildRunRecord,
  createEmptyProgress,
  isValidProgress,
  stockLeftTotal,
  type AchievementId,
  type PlayerProgress,
  type ProgressUpdate,
  type RunSnapshot,
} from "../logic/progress";
import type { GameState } from "../state/game-state";

const PROGRESS_KEY = "alchemists-cauldron.progress";

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw === null) {
      return createEmptyProgress();
    }

    const parsed: unknown = JSON.parse(raw);
    const progress = isValidProgress(parsed);
    if (!progress) {
      return createEmptyProgress();
    }

    return progress;
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(progress: PlayerProgress): boolean {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(): boolean {
  try {
    localStorage.removeItem(PROGRESS_KEY);
    return true;
  } catch {
    return false;
  }
}

function snapshotFromState(
  state: GameState,
  playedAt = Date.now(),
): RunSnapshot | null {
  if (!state.gameOverReason) {
    return null;
  }

  return {
    difficulty: state.difficulty,
    score: state.score,
    successfulBrews: state.successfulBrews,
    failedBrews: state.failedBrews,
    reactionsFired: state.reactionsFired,
    bestSuccessStreak: state.bestSuccessStreak,
    livesLeft: state.lives,
    timeLeft: state.timeLeft,
    stockLeft: stockLeftTotal(state.shelfStock),
    reason: state.gameOverReason,
    playedAt,
  };
}

export function recordFinishedRun(
  state: GameState,
  playedAt = Date.now(),
): ProgressUpdate | null {
  const snapshot = snapshotFromState(state, playedAt);
  if (!snapshot) {
    return null;
  }

  const update = applyRun(
    loadProgress(),
    buildRunRecord(snapshot),
    ACHIEVEMENTS,
  );

  if (!saveProgress(update.progress)) {
    return null;
  }

  return update;
}

export function unlockedAchievementNames(
  ids: readonly AchievementId[],
): string[] {
  const names: string[] = [];
  for (const id of ids) {
    const achievement = ACHIEVEMENTS.find((item) => item.id === id);
    if (achievement) {
      names.push(achievement.name);
    }
  }
  return names;
}
