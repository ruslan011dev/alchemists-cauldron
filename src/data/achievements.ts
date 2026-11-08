import type {
  AchievementDefinition,
  PlayerProgress,
  RunRecord,
} from "../logic/progress";

function lifetime(progress: PlayerProgress): PlayerProgress["stats"] {
  return progress.stats;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: "first-brew",
    name: "First Brew",
    description: "Succeed at least one brew.",
    isComplete: (progress) => lifetime(progress).totalSuccessfulBrews >= 1,
  },
  {
    id: "apprentice",
    name: "Apprentice",
    description: "Succeed at least one brew.",
    isComplete: (progress) => lifetime(progress).totalSuccessfulBrews >= 1,
  },
  {
    id: "journeyman",
    name: "Journeyman",
    description: "Succeed 15 brews across all runs.",
    isComplete: (progress) => lifetime(progress).totalSuccessfulBrews >= 15,
  },
  {
    id: "hard-scorer",
    name: "Hard Scorer",
    description: "Score at least 300 on Hard.",
    isComplete: (progress) =>
      lifetime(progress).bestScoreByDifficulty.hard >= 300,
  },
  {
    id: "survivor",
    name: "Survivor",
    description: "Finish a scored run with at least one life left.",
    isComplete: (_progress, run: RunRecord) =>
      run.score > 0 && run.livesLeft >= 1,
  },
  {
    id: "reaction-adept",
    name: "Reaction Adept",
    description: "Trigger at least one reaction.",
    unlockId: "codex-reactions",
    isComplete: (progress) => lifetime(progress).totalReactionsFired >= 1,
  },
  {
    id: "streak-three",
    name: "Hot Streak",
    description: "Succeed 3 brews in a row in one run.",
    isComplete: (_progress, run) => run.bestSuccessStreak >= 3,
  },
  {
    id: "stock-saver",
    name: "Stock Saver",
    description: "End a scored run with at least 5 stock left.",
    isComplete: (_progress, run) => run.score > 0 && run.stockLeft >= 5,
  },
  {
    id: "high-score",
    name: "High Score",
    description: "Reach a best score of 1000.",
    isComplete: (progress) => lifetime(progress).bestScore >= 1000,
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Finish 10 runs.",
    isComplete: (progress) => lifetime(progress).gamesPlayed >= 10,
  },
];

export function achievementById(
  id: AchievementDefinition["id"],
): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((item) => item.id === id);
}
