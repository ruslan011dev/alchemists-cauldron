import { LEVEL_ONE } from "../data/difficulty";
import { INGREDIENTS, type IIngredient } from "../data/ingredients";
import type { IRecipe } from "../data/recipes";
import { addIngredient } from "../logic/add-ingredient";
import { isBrewSuccess } from "../logic/brew-check";
import { calculateCauldron } from "../logic/calculate-cauldron";
import { pickRecipe } from "../logic/recipe-generator";
import { createStock, isOutOfIngredients } from "../logic/stock";
import { remainingSeconds } from "../logic/timer";

export type BrewResult = "success" | "failure" | null;
export type GameOverReason = "time" | "lives" | "ingredients";

export interface GameState {
  started: boolean;
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

export function createInitialState(): GameState {
  const shelf = INGREDIENTS.slice(0, LEVEL_ONE.shelfCount);
  const shelfStock: Record<string, number> = {};

  for (const ingredient of shelf) {
    shelfStock[ingredient.id] = 0;
  }

  return {
    started: false,
    shelf,
    cauldronIngredients: [],
    shelfStock,
    maxInCauldron: LEVEL_ONE.maxInCauldron,
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

export function startGame(state: GameState, now = Date.now()): GameState {
  const timeLeft = LEVEL_ONE.startingTime;

  return {
    ...state,
    started: true,
    cauldronIngredients: [],
    shelfStock: createStock(state.shelf),
    activeRecipe: pickRecipe(LEVEL_ONE.difficulty),
    score: 0,
    timeLeft,
    lives: LEVEL_ONE.lives,
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

export function exitToMenu(): GameState {
  return createInitialState();
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
  const success = isBrewSuccess(
    values,
    current.activeRecipe,
    LEVEL_ONE.tolerance,
  );

  if (success) {
    const timeLeft = Math.min(
      LEVEL_ONE.startingTime,
      current.timeLeft + LEVEL_ONE.timeBonus,
    );

    return settle({
      ...current,
      score: current.score + LEVEL_ONE.scorePerBrew,
      timeLeft,
      endAt: now + timeLeft * 1000,
      cauldronIngredients: [],
      activeRecipe: pickRecipe(LEVEL_ONE.difficulty),
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
