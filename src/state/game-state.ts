import { LEVEL_ONE } from "../data/difficulty";
import { INGREDIENTS, type IIngredient } from "../data/ingredients";
import type { IRecipe } from "../data/recipes";
import { addIngredient } from "../logic/add-ingredient";
import { isBrewSuccess } from "../logic/brew-check";
import { calculateCauldron } from "../logic/calculate-cauldron";
import { pickRecipe } from "../logic/recipe-generator";
import { createStock } from "../logic/stock";

export type BrewResult = "success" | "failure" | null;

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
  };
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    started: true,
    cauldronIngredients: [],
    shelfStock: createStock(state.shelf),
    activeRecipe: pickRecipe(LEVEL_ONE.difficulty),
    score: 0,
    timeLeft: LEVEL_ONE.startingTime,
    lives: LEVEL_ONE.lives,
    lastBrew: null,
  };
}

export function addToCauldron(state: GameState, id: string): GameState {
  if (!state.started || state.lives <= 0) {
    return state;
  }

  const next = addIngredient(state, state.shelf, id);
  return {
    ...state,
    cauldronIngredients: next.cauldronIngredients,
    shelfStock: next.shelfStock,
  };
}

export function brewPotion(state: GameState): GameState {
  if (
    !state.started ||
    !state.activeRecipe ||
    state.lives <= 0 ||
    state.cauldronIngredients.length === 0
  ) {
    return state;
  }

  const values = calculateCauldron(state.cauldronIngredients);
  const success = isBrewSuccess(
    values,
    state.activeRecipe,
    LEVEL_ONE.tolerance,
  );

  if (success) {
    return {
      ...state,
      score: state.score + LEVEL_ONE.scorePerBrew,
      timeLeft: Math.min(
        LEVEL_ONE.startingTime,
        state.timeLeft + LEVEL_ONE.timeBonus,
      ),
      cauldronIngredients: [],
      activeRecipe: pickRecipe(LEVEL_ONE.difficulty),
      lastBrew: "success",
    };
  }

  return {
    ...state,
    lives: state.lives - 1,
    cauldronIngredients: [],
    lastBrew: "failure",
  };
}
