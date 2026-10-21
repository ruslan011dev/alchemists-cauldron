export interface LeaderboardEntry {
  name: string;
  score: number;
  playedAt: number;
}

export const TOP_SIZE = 10;

const NAME_PATTERN = /^[\p{L}0-9 _-]{2,15}$/u;

export function isValidName(name: string): boolean {
  return NAME_PATTERN.test(name);
}

export function compareEntries(
  left: LeaderboardEntry,
  right: LeaderboardEntry,
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return left.playedAt - right.playedAt;
}

export function isTopTenScore(
  entries: readonly LeaderboardEntry[],
  score: number,
): boolean {
  if (entries.length < TOP_SIZE) {
    return true;
  }

  const last = entries[TOP_SIZE - 1];
  return last !== undefined && score > last.score;
}

export function insertEntry(
  entries: readonly LeaderboardEntry[],
  entry: LeaderboardEntry,
): LeaderboardEntry[] {
  return [...entries, entry].sort(compareEntries).slice(0, TOP_SIZE);
}

export function formatEntryDate(playedAt: number): string {
  const date = new Date(playedAt);
  const pad = (value: number): string => String(value).padStart(2, "0");

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
