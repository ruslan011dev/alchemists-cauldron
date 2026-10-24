import { DIFFICULTY_SETTINGS } from "../data/difficulty";
import { INGREDIENTS, type IIngredient } from "../data/ingredients";
import type { Difficulty, IRecipe } from "../data/recipes";
import { reactionsFor, type IReaction } from "../data/reactions";
import { addIngredient } from "../logic/add-ingredient";
import type { SavedGame } from "../logic/game-save";
import { isBrewSuccess } from "../logic/brew-check";
import { cauldronValues, firedReactions } from "../logic/reactions";
import { pickRecipe } from "../logic/recipe-generator";
import { createStock, isOutOfIngredients } from "../logic/stock";
import { remainingSeconds } from "../logic/timer";

export type BrewResult = "success" | "failure" | null;
export type GameOverReason = "time" | "lives" | "ingredients";

export interface GameState {
  started: boolean;
  difficulty: Difficulty;
  shelf: readonly IIngredient[];
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
  maxInCauldron: number;
  activeRecipe: IRecipe | null;
  score: number;
  timeLeft: number;
  lives: number;
  lastBrew: BrewResult;
  endAt: number | null;
  gameOverReason: GameOverReason | null;
  paused: boolean;
  lastReactionId: string | null;
}

export function createInitialState(
  difficulty: Difficulty = "medium",
): GameState {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const shelf = INGREDIENTS.slice(0, settings.shelfCount);
  const shelfStock: Record<string, number> = {};

  for (const ingredient of shelf) {
    shelfStock[ingredient.id] = 0;
  }

  return {
    started: false,
    difficulty,
    shelf,
    cauldronIngredients: [],
    shelfStock,
    maxInCauldron: settings.maxInCauldron,
    activeRecipe: null,
    score: 0,
    timeLeft: 0,
    lives: 0,
    lastBrew: null,
    endAt: null,
    gameOverReason: null,
    paused: false,
    lastReactionId: null,
  };
}

export function selectDifficulty(
  state: GameState,
  difficulty: Difficulty,
): GameState {
  if (state.started) {
    return state;
  }

  return createInitialState(difficulty);
}

export function startGame(state: GameState, now = Date.now()): GameState {
  const settings = DIFFICULTY_SETTINGS[state.difficulty];
  const shelf = INGREDIENTS.slice(0, settings.shelfCount);
  const timeLeft = settings.startingTime;

  return {
    ...state,
    started: true,
    shelf,
    cauldronIngredients: [],
    shelfStock: createStock(shelf),
    maxInCauldron: settings.maxInCauldron,
    activeRecipe: pickRecipe(settings.difficulty),
    score: 0,
    timeLeft,
    lives: settings.lives,
    lastBrew: null,
    endAt: now + timeLeft * 1000,
    gameOverReason: null,
    paused: false,
    lastReactionId: null,
  };
}

export function pauseGame(state: GameState, now = Date.now()): GameState {
  if (!state.started || state.paused || state.gameOverReason) {
    return state;
  }

  const current = syncTime(state, now);
  if (current.gameOverReason) {
    return current;
  }

  return {
    ...current,
    paused: true,
    endAt: null,
  };
}

export function resumeGame(state: GameState, now = Date.now()): GameState {
  if (!state.paused) {
    return state;
  }

  return {
    ...state,
    paused: false,
    endAt: now + state.timeLeft * 1000,
  };
}

export function exitToMenu(state: GameState): GameState {
  return createInitialState(state.difficulty);
}

export function continueGame(save: SavedGame): GameState {
  const settings = DIFFICULTY_SETTINGS[save.difficulty];
  const shelf = INGREDIENTS.slice(0, settings.shelfCount);
  const shelfStock: Record<string, number> = {};

  for (const ingredient of shelf) {
    shelfStock[ingredient.id] = save.shelfStock[ingredient.id] ?? 0;
  }

  return {
    started: true,
    difficulty: save.difficulty,
    shelf,
    cauldronIngredients: [...save.cauldronIngredients],
    shelfStock,
    maxInCauldron: settings.maxInCauldron,
    activeRecipe: save.activeRecipe,
    score: save.score,
    timeLeft: Math.min(settings.startingTime, save.timeLeft),
    lives: save.lives,
    lastBrew: null,
    endAt: null,
    gameOverReason: null,
    paused: true,
    lastReactionId: null,
  };
}

export function finishGame(
  state: GameState,
  reason: GameOverReason,
): GameState {
  return {
    ...state,
    endAt: null,
    gameOverReason: reason,
    paused: false,
    timeLeft: reason === "time" ? 0 : state.timeLeft,
  };
}

function settle(state: GameState): GameState {
  if (state.gameOverReason) {
    return state;
  }

  if (state.lives <= 0) {
    return finishGame(state, "lives");
  }

  if (isOutOfIngredients(state.shelfStock, state.cauldronIngredients.length)) {
    return finishGame(state, "ingredients");
  }

  return state;
}

export function syncTime(state: GameState, now: number): GameState {
  if (
    !state.started ||
    state.paused ||
    state.gameOverReason ||
    state.endAt === null
  ) {
    return state;
  }

  const timeLeft = remainingSeconds(state.endAt, now);
  if (timeLeft <= 0) {
    return finishGame({ ...state, timeLeft: 0 }, "time");
  }

  return { ...state, timeLeft };
}

export function canAddIngredient(state: GameState): boolean {
  return (
    state.started &&
    !state.paused &&
    state.gameOverReason === null &&
    state.lives > 0 &&
    state.cauldronIngredients.length < state.maxInCauldron
  );
}

export function addToCauldron(
  state: GameState,
  id: string,
  now = Date.now(),
): GameState {
  const current = syncTime(state, now);
  if (!canAddIngredient(current)) {
    return current;
  }

  const next = addIngredient(current, current.shelf, id);
  if (next === current) {
    return current;
  }

  const reactions = reactionsFor(current.difficulty);
  const fired = firedReactions(
    current.cauldronIngredients,
    next.cauldronIngredients,
    reactions,
  );
  let updated: GameState = {
    ...current,
    cauldronIngredients: next.cauldronIngredients,
    shelfStock: next.shelfStock,
    lastReactionId: fired[0]?.id ?? null,
  };

  for (const reaction of fired) {
    updated = applyReactionFire(updated, reaction, now);
    if (updated.gameOverReason) {
      return updated;
    }
  }

  return settle(updated);
}

function applyReactionFire(
  state: GameState,
  reaction: IReaction,
  now: number,
): GameState {
  let next = state;
  if (reaction.effect.clearCauldron) {
    next = { ...next, cauldronIngredients: [] };
  }

  if (reaction.effect.loseLife) {
    next = { ...next, lives: next.lives - 1 };
    if (next.lives <= 0) {
      return settle(next);
    }
  }

  if (reaction.effect.timePenalty > 0) {
    const timeLeft = Math.max(0, next.timeLeft - reaction.effect.timePenalty);
    next = {
      ...next,
      timeLeft,
      endAt: timeLeft === 0 ? null : now + timeLeft * 1000,
    };
    if (timeLeft === 0) {
      return finishGame(next, "time");
    }
  }

  return next;
}

export function brewPotion(state: GameState, now = Date.now()): GameState {
  if (state.paused) {
    return state;
  }

  const current = syncTime(state, now);

  if (
    !current.started ||
    current.gameOverReason ||
    !current.activeRecipe ||
    current.lives <= 0 ||
    current.cauldronIngredients.length === 0
  ) {
    return current;
  }

  const values = cauldronValues(
    current.cauldronIngredients,
    current.difficulty,
  );
  const settings = DIFFICULTY_SETTINGS[current.difficulty];
  const success = isBrewSuccess(
    values,
    current.activeRecipe,
    settings.tolerance,
  );

  if (success) {
    const timeLeft = Math.min(
      settings.startingTime,
      current.timeLeft + settings.timeBonus,
    );

    return settle({
      ...current,
      score: current.score + settings.scorePerBrew,
      timeLeft,
      endAt: now + timeLeft * 1000,
      cauldronIngredients: [],
      activeRecipe: pickRecipe(settings.difficulty),
      lastBrew: "success",
      lastReactionId: null,
    });
  }

  return settle({
    ...current,
    lives: current.lives - 1,
    cauldronIngredients: [],
    lastBrew: "failure",
    lastReactionId: null,
  });
}
