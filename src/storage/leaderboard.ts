import {
  TOP_SIZE,
  compareEntries,
  insertEntry,
  isValidName,
  type LeaderboardEntry,
} from "../logic/leaderboard";

const STORAGE_KEY = "alchemists-cauldron.level-1";

function isStoredEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as {
    name?: unknown;
    score?: unknown;
    playedAt?: unknown;
  };

  return (
    typeof entry.name === "string" &&
    typeof entry.score === "number" &&
    Number.isFinite(entry.score) &&
    typeof entry.playedAt === "number" &&
    Number.isFinite(entry.playedAt)
  );
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isStoredEntry).sort(compareEntries).slice(0, TOP_SIZE);
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: readonly LeaderboardEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function addScore(
  name: string,
  score: number,
  playedAt = Date.now(),
): boolean {
  if (!isValidName(name) || !Number.isFinite(score)) {
    return false;
  }

  return saveLeaderboard(
    insertEntry(loadLeaderboard(), { name, score, playedAt }),
  );
}

export function clearLeaderboard(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
