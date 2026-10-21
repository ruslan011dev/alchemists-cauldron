import type { Difficulty } from "../data/recipes";
import {
  TOP_SIZE,
  compareEntries,
  insertEntry,
  isValidName,
  type LeaderboardEntry,
} from "../logic/leaderboard";

const LEGACY_MEDIUM_KEY = "alchemists-cauldron.level-1";

function storageKey(difficulty: Difficulty): string {
  return `alchemists-cauldron.${difficulty}`;
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function toEntry(
  value: unknown,
  listDifficulty: Difficulty,
): LeaderboardEntry | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const entry = value as {
    name?: unknown;
    score?: unknown;
    playedAt?: unknown;
    difficulty?: unknown;
  };

  if (
    typeof entry.name !== "string" ||
    typeof entry.score !== "number" ||
    !Number.isFinite(entry.score) ||
    typeof entry.playedAt !== "number" ||
    !Number.isFinite(entry.playedAt)
  ) {
    return null;
  }

  const difficulty = isDifficulty(entry.difficulty)
    ? entry.difficulty
    : listDifficulty;
  if (difficulty !== listDifficulty) {
    return null;
  }

  return {
    name: entry.name,
    score: entry.score,
    playedAt: entry.playedAt,
    difficulty,
  };
}

function readEntries(raw: string, difficulty: Difficulty): LeaderboardEntry[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  const entries: LeaderboardEntry[] = [];
  for (const value of parsed) {
    const entry = toEntry(value, difficulty);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries.sort(compareEntries).slice(0, TOP_SIZE);
}

export function loadLeaderboard(difficulty: Difficulty): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(difficulty));
    if (raw !== null) {
      return readEntries(raw, difficulty);
    }

    if (difficulty !== "medium") {
      return [];
    }

    const legacy = localStorage.getItem(LEGACY_MEDIUM_KEY);
    if (legacy === null) {
      return [];
    }

    const entries = readEntries(legacy, "medium");
    if (saveLeaderboard(entries)) {
      try {
        localStorage.removeItem(LEGACY_MEDIUM_KEY);
      } catch {
        return entries;
      }
    }

    return entries;
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: readonly LeaderboardEntry[]): boolean {
  const difficulty = entries[0]?.difficulty;
  if (!difficulty) {
    return true;
  }

  try {
    localStorage.setItem(storageKey(difficulty), JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function addScore(
  name: string,
  score: number,
  difficulty: Difficulty,
  playedAt = Date.now(),
): boolean {
  if (!isValidName(name) || !Number.isFinite(score)) {
    return false;
  }

  return saveLeaderboard(
    insertEntry(loadLeaderboard(difficulty), {
      name,
      score,
      playedAt,
      difficulty,
    }),
  );
}

export function clearLeaderboard(difficulty: Difficulty): boolean {
  try {
    localStorage.removeItem(storageKey(difficulty));
    if (difficulty === "medium") {
      localStorage.removeItem(LEGACY_MEDIUM_KEY);
    }
    return true;
  } catch {
    return false;
  }
}
