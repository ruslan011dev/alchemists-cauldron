import { ACHIEVEMENTS } from "../data/achievements";
import { difficultyName } from "../data/difficulty";
import { formatEntryDate } from "../logic/leaderboard";
import type {
  PlayerProgress,
  RunEndReason,
  RunRecord,
  UnlockId,
} from "../logic/progress";

type ProgressTab = "stats" | "history" | "achievements";

const TABS: readonly { id: ProgressTab; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "history", label: "History" },
  { id: "achievements", label: "Achievements" },
];

const END_REASON: Record<RunEndReason, string> = {
  time: "Time",
  lives: "Lives",
  ingredients: "Ingredients",
};

const UNLOCK_NAME: Record<UnlockId, string> = {
  "theme-night-lab": "Night Lab",
  "theme-parchment": "Parchment",
  "codex-reactions": "Reaction Codex",
};

export interface ProgressView {
  root: HTMLElement;
  back: HTMLButtonElement;
  render: (progress: PlayerProgress) => void;
}

export function createProgressView(): ProgressView {
  let tab: ProgressTab = "stats";
  let progress: PlayerProgress | null = null;

  const root = document.createElement("section");
  root.className = "progress";
  root.hidden = true;

  const title = document.createElement("h2");
  title.id = "progress-title";
  title.textContent = "Progress";
  root.setAttribute("aria-labelledby", "progress-title");

  const tabs = document.createElement("div");
  tabs.className = "progress-tabs";
  tabs.setAttribute("role", "tablist");
  const tabButtons = new Map<ProgressTab, HTMLButtonElement>();

  for (const item of TABS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pause-button progress-tab";
    button.textContent = item.label;
    button.setAttribute("role", "tab");
    button.addEventListener("click", () => {
      tab = item.id;
      paint();
    });
    tabButtons.set(item.id, button);
    tabs.append(button);
  }

  const body = document.createElement("div");
  body.className = "progress-body";

  const actions = document.createElement("div");
  actions.className = "game-over-actions";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "start-button";
  back.textContent = "Back";
  actions.append(back);

  root.append(title, tabs, body, actions);

  const paint = (): void => {
    for (const [id, button] of tabButtons) {
      const selected = id === tab;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
    }

    body.replaceChildren();
    if (!progress) {
      return;
    }

    if (tab === "stats") {
      body.append(renderStats(progress));
      return;
    }

    if (tab === "history") {
      body.append(renderHistory(progress.runs));
      return;
    }

    body.append(renderAchievements(progress));
  };

  return {
    root,
    back,
    render(next: PlayerProgress): void {
      progress = next;
      paint();
    },
  };
}

function renderStats(progress: PlayerProgress): HTMLElement {
  const stats = progress.stats;
  const grid = document.createElement("dl");
  grid.className = "stat-grid";

  const rows: readonly [string, string][] = [
    ["Games", String(stats.gamesPlayed)],
    ["Best score", String(stats.bestScore)],
    ["Total score", String(stats.totalScore)],
    ["Easy best", String(stats.bestScoreByDifficulty.easy)],
    ["Medium best", String(stats.bestScoreByDifficulty.medium)],
    ["Hard best", String(stats.bestScoreByDifficulty.hard)],
    [
      "Brews",
      `${stats.totalSuccessfulBrews} ok · ${stats.totalFailedBrews} failed`,
    ],
    ["Reactions", String(stats.totalReactionsFired)],
    ["Best streak", String(stats.bestSuccessStreak)],
    [
      "Unlocks",
      `${progress.unlocks.length} / ${Object.keys(UNLOCK_NAME).length}`,
    ],
  ];

  for (const [label, value] of rows) {
    const card = document.createElement("div");
    card.className = "stat-card";
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    card.append(term, detail);
    grid.append(card);
  }

  return grid;
}

function renderHistory(runs: readonly RunRecord[]): HTMLElement {
  if (runs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "progress-empty";
    empty.textContent = "No finished runs yet.";
    return empty;
  }

  const wrap = document.createElement("div");
  wrap.className = "leaderboard-wrap";
  const table = document.createElement("table");
  table.className = "leaderboard-table";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");

  for (const label of ["Date", "Difficulty", "Score", "Brews", "End"]) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = label;
    headRow.append(cell);
  }

  head.append(headRow);
  const body = document.createElement("tbody");

  for (const run of runs) {
    const row = document.createElement("tr");
    const values = [
      formatEntryDate(run.playedAt),
      difficultyName(run.difficulty),
      String(run.score),
      `${run.successfulBrews} ok · ${run.failedBrews} failed`,
      END_REASON[run.reason],
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    body.append(row);
  }

  table.append(head, body);
  wrap.append(table);
  return wrap;
}

function renderAchievements(progress: PlayerProgress): HTMLElement {
  const list = document.createElement("div");
  list.className = "achievement-list";

  for (const achievement of ACHIEVEMENTS) {
    const unlocked = progress.achievements.find(
      (item) => item.id === achievement.id,
    );
    const card = document.createElement("article");
    card.className = unlocked ? "achievement is-open" : "achievement is-locked";

    const name = document.createElement("h3");
    name.textContent = achievement.name;
    const description = document.createElement("p");
    description.textContent = achievement.description;
    const status = document.createElement("p");
    status.className = "achievement-status";
    status.textContent = unlocked
      ? `Unlocked ${formatEntryDate(unlocked.unlockedAt)}`
      : "Locked";

    card.append(name, description, status);

    if (achievement.unlockId) {
      const reward = document.createElement("p");
      reward.className = "achievement-reward";
      const rewardName = UNLOCK_NAME[achievement.unlockId];
      reward.textContent = unlocked
        ? `Opened: ${rewardName}`
        : `Opens: ${rewardName}`;
      card.append(reward);
    }

    list.append(card);
  }

  return list;
}
