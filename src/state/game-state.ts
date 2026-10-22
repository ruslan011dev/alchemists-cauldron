import { DIFFICULTY_SETTINGS } from "../data/difficulty";
import { INGREDIENTS, type IIngredient } from "../data/ingredients";
import type { Difficulty, IRecipe } from "../data/recipes";
import { addIngredient } from "../logic/add-ingredient";
import type { SavedGame } from "../logic/game-save";
import { isBrewSuccess } from "../logic/brew-check";
import { calculateCauldron } from "../logic/calculate-cauldron";
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

export function addToCauldron(state: GameState, id: string): GameState {
  if (
    !state.started ||
    state.paused ||
    state.gameOverReason ||
    state.lives <= 0
  ) {
    return state;
  }

  const next = addIngredient(state, state.shelf, id);
  return {
    ...state,
    cauldronIngredients: next.cauldronIngredients,
    shelfStock: next.shelfStock,
  };
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

  const values = calculateCauldron(current.cauldronIngredients);
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
    });
  }

  return settle({
    ...current,
    lives: current.lives - 1,
    cauldronIngredients: [],
    lastBrew: "failure",
  });
}
