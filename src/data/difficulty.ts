export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultySettings {
  difficulty: Difficulty;
  shelfCount: number;
  maxInCauldron: number;
  startingTime: number;
  tolerance: number;
  lives: number;
  scorePerBrew: number;
  timeBonus: number;
  reactions: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    difficulty: "easy",
    shelfCount: 4,
    maxInCauldron: 4,
    startingTime: 180,
    tolerance: 12,
    lives: 5,
    scorePerBrew: 100,
    timeBonus: 15,
    reactions: 0,
  },
  medium: {
    difficulty: "medium",
    shelfCount: 6,
    maxInCauldron: 4,
    startingTime: 150,
    tolerance: 8,
    lives: 3,
    scorePerBrew: 200,
    timeBonus: 10,
    reactions: 2,
  },
  hard: {
    difficulty: "hard",
    shelfCount: 8,
    maxInCauldron: 5,
    startingTime: 150,
    tolerance: 5,
    lives: 3,
    scorePerBrew: 300,
    timeBonus: 5,
    reactions: 3,
  },
};

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export function difficultyName(difficulty: Difficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function difficultyButtonText(difficulty: Difficulty): string {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const reactions =
    settings.reactions === 0
      ? "no reactions"
      : `${settings.reactions} reactions`;

  return `${difficultyName(difficulty)} · shelf ${settings.shelfCount} · ${settings.startingTime}s · ±${settings.tolerance} · ${settings.lives} lives · ${reactions}`;
}
