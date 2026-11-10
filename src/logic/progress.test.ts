import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ACHIEVEMENTS } from "../data/achievements";
import {
  MAX_RUN_HISTORY,
  applyRun,
  createEmptyProgress,
  hasAchievement,
  hasUnlock,
  isValidProgress,
  stockLeftTotal,
  type RunRecord,
} from "./progress";

function makeRun(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    playedAt: overrides.playedAt ?? 1_700_000_000_000,
    difficulty: overrides.difficulty ?? "medium",
    score: overrides.score ?? 0,
    successfulBrews: overrides.successfulBrews ?? 0,
    failedBrews: overrides.failedBrews ?? 0,
    reactionsFired: overrides.reactionsFired ?? 0,
    bestSuccessStreak: overrides.bestSuccessStreak ?? 0,
    livesLeft: overrides.livesLeft ?? 0,
    timeLeft: overrides.timeLeft ?? 10,
    stockLeft: overrides.stockLeft ?? 0,
    reason: overrides.reason ?? "time",
  };
}

describe("player progress", () => {
  it("starts empty", () => {
    const progress = createEmptyProgress();

    assert.equal(progress.stats.gamesPlayed, 0);
    assert.equal(progress.stats.bestScore, 0);
    assert.equal(progress.runs.length, 0);
    assert.equal(progress.achievements.length, 0);
    assert.equal(progress.unlocks.length, 0);
  });

  it("sums the stock left on the shelf", () => {
    assert.equal(stockLeftTotal({ a: 2, b: 5 }), 7);
  });

  it("records the first brew badges without locking the themes", () => {
    const update = applyRun(
      createEmptyProgress(),
      makeRun({ successfulBrews: 1, score: 200 }),
      ACHIEVEMENTS,
    );

    assert.deepEqual(update.newlyUnlocked, ["first-brew", "apprentice"]);
    assert.equal(hasAchievement(update.progress, "first-brew"), true);
    assert.equal(hasAchievement(update.progress, "apprentice"), true);
    assert.equal(hasUnlock(update.progress, "theme-night-lab"), false);
    assert.equal(hasUnlock(update.progress, "theme-parchment"), false);
    assert.equal(hasUnlock(update.progress, "codex-reactions"), false);
    assert.equal(update.progress.stats.totalSuccessfulBrews, 1);
    assert.equal(update.progress.stats.bestScoreByDifficulty.medium, 200);
  });

  it("does not unlock the first brew after a failed run", () => {
    const update = applyRun(
      createEmptyProgress(),
      makeRun({ failedBrews: 2, score: 0 }),
      ACHIEVEMENTS,
    );

    assert.deepEqual(update.newlyUnlocked, []);
    assert.equal(hasAchievement(update.progress, "first-brew"), false);
  });

  it("does not grant the first-brew badges again", () => {
    const first = applyRun(
      createEmptyProgress(),
      makeRun({ successfulBrews: 1, score: 100 }),
      ACHIEVEMENTS,
    );
    const second = applyRun(
      first.progress,
      makeRun({
        playedAt: 1_700_000_100_000,
        successfulBrews: 1,
        score: 400,
      }),
      ACHIEVEMENTS,
    );

    assert.equal(hasAchievement(first.progress, "apprentice"), true);
    assert.equal(second.newlyUnlocked.includes("apprentice"), false);
    assert.equal(second.progress.stats.totalSuccessfulBrews, 2);
    assert.equal(second.progress.runs[0]?.playedAt, 1_700_000_100_000);
  });

  it("keeps the best score separately for each difficulty", () => {
    const easy = applyRun(
      createEmptyProgress(),
      makeRun({ difficulty: "easy", score: 100, successfulBrews: 1 }),
      ACHIEVEMENTS,
    );
    const hard = applyRun(
      easy.progress,
      makeRun({ difficulty: "hard", score: 300, successfulBrews: 1 }),
      ACHIEVEMENTS,
    );

    assert.equal(hard.progress.stats.bestScore, 300);
    assert.equal(hard.progress.stats.bestScoreByDifficulty.easy, 100);
    assert.equal(hard.progress.stats.bestScoreByDifficulty.hard, 300);
    assert.equal(hasAchievement(hard.progress, "hard-scorer"), true);
  });

  it("does not treat a medium score of 300 as a hard clear", () => {
    const update = applyRun(
      createEmptyProgress(),
      makeRun({ difficulty: "medium", score: 300, successfulBrews: 1 }),
      ACHIEVEMENTS,
    );

    assert.equal(hasAchievement(update.progress, "hard-scorer"), false);
  });

  it("unlocks survivor only when a scored run still has a life", () => {
    const scored = applyRun(
      createEmptyProgress(),
      makeRun({ score: 100, successfulBrews: 1, livesLeft: 1 }),
      ACHIEVEMENTS,
    );
    const empty = applyRun(
      createEmptyProgress(),
      makeRun({ score: 0, livesLeft: 2 }),
      ACHIEVEMENTS,
    );

    assert.equal(hasAchievement(scored.progress, "survivor"), true);
    assert.equal(hasAchievement(empty.progress, "survivor"), false);
  });

  it("opens the reaction codex after one reaction", () => {
    const update = applyRun(
      createEmptyProgress(),
      makeRun({ reactionsFired: 1 }),
      ACHIEVEMENTS,
    );

    assert.equal(hasAchievement(update.progress, "reaction-adept"), true);
    assert.equal(hasUnlock(update.progress, "codex-reactions"), true);
    assert.equal(hasUnlock(update.progress, "theme-parchment"), false);
  });

  it("unlocks a hot streak, a saved stock, and a high score from one run", () => {
    const update = applyRun(
      createEmptyProgress(),
      makeRun({
        score: 1000,
        successfulBrews: 3,
        bestSuccessStreak: 3,
        stockLeft: 5,
        livesLeft: 1,
      }),
      ACHIEVEMENTS,
    );

    assert.equal(hasAchievement(update.progress, "streak-three"), true);
    assert.equal(hasAchievement(update.progress, "stock-saver"), true);
    assert.equal(hasAchievement(update.progress, "high-score"), true);
  });

  it("does not call a scoreless stock remainder a stock saver", () => {
    const update = applyRun(
      createEmptyProgress(),
      makeRun({ score: 0, stockLeft: 9 }),
      ACHIEVEMENTS,
    );

    assert.equal(hasAchievement(update.progress, "stock-saver"), false);
  });

  it("unlocks dedicated on the tenth finished run", () => {
    let progress = createEmptyProgress();
    for (let index = 0; index < 9; index += 1) {
      progress = applyRun(
        progress,
        makeRun({ playedAt: 1_700_000_000_000 + index }),
        ACHIEVEMENTS,
      ).progress;
    }

    assert.equal(hasAchievement(progress, "dedicated"), false);

    const tenth = applyRun(
      progress,
      makeRun({ playedAt: 1_700_000_000_010 }),
      ACHIEVEMENTS,
    );
    assert.equal(hasAchievement(tenth.progress, "dedicated"), true);
    assert.equal(tenth.progress.stats.gamesPlayed, 10);
  });

  it("keeps only the newest runs up to the history limit", () => {
    let progress = createEmptyProgress();
    for (let index = 0; index < MAX_RUN_HISTORY + 5; index += 1) {
      progress = applyRun(
        progress,
        makeRun({ playedAt: index }),
        ACHIEVEMENTS,
      ).progress;
    }

    assert.equal(progress.runs.length, MAX_RUN_HISTORY);
    assert.equal(progress.runs[0]?.playedAt, MAX_RUN_HISTORY + 4);
    assert.equal(progress.stats.gamesPlayed, MAX_RUN_HISTORY + 5);
  });

  it("does not change the progress object it was given", () => {
    const before = createEmptyProgress();
    applyRun(before, makeRun({ successfulBrews: 1, score: 100 }), ACHIEVEMENTS);

    assert.equal(before.runs.length, 0);
    assert.equal(before.achievements.length, 0);
  });

  it("accepts a saved progress record and drops a repeated badge", () => {
    const saved = {
      version: 1,
      runs: [makeRun({ successfulBrews: 1, score: 100 })],
      stats: {
        gamesPlayed: 1,
        totalScore: 100,
        totalSuccessfulBrews: 1,
        totalFailedBrews: 0,
        totalReactionsFired: 0,
        bestScore: 100,
        bestScoreByDifficulty: { easy: 0, medium: 100, hard: 0 },
        bestSuccessStreak: 0,
      },
      achievements: [
        { id: "first-brew", unlockedAt: 10 },
        { id: "first-brew", unlockedAt: 20 },
      ],
      unlocks: ["theme-night-lab", "theme-night-lab"],
    };

    const progress = isValidProgress(saved);
    if (!progress) {
      throw new Error("expected a valid progress record");
    }
    assert.equal(progress.achievements.length, 1);
    assert.deepEqual(progress.unlocks, ["theme-night-lab"]);
  });

  it("rejects a broken or outdated save", () => {
    assert.equal(isValidProgress(null), null);
    assert.equal(
      isValidProgress({ version: 2, runs: [], achievements: [], unlocks: [] }),
      null,
    );
    assert.equal(
      isValidProgress({
        version: 1,
        runs: [{ playedAt: -1 }],
        achievements: [],
        unlocks: [],
        stats: createEmptyProgress().stats,
      }),
      null,
    );
  });
});
