import { formatEntryDate, type LeaderboardEntry } from "../logic/leaderboard";

export function renderLeaderboard(
  body: HTMLElement,
  entries: readonly LeaderboardEntry[],
): void {
  body.replaceChildren();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No results yet.";
    row.append(cell);
    body.append(row);
    return;
  }

  for (const [index, entry] of entries.entries()) {
    const row = document.createElement("tr");
    const values = [
      String(index + 1),
      entry.name,
      String(entry.score),
      formatEntryDate(entry.playedAt),
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    body.append(row);
  }
}
