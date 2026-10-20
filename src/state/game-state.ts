import { LEVEL_ONE } from "../data/difficulty";
import { INGREDIENTS, type IIngredient } from "../data/ingredients";
import type { IRecipe } from "../data/recipes";
import { addIngredient } from "../logic/add-ingredient";
import { pickRecipe } from "../logic/recipe-generator";
import { createStock } from "../logic/stock";

export interface GameState {
  started: boolean;
  shelf: readonly IIngredient[];
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
  maxInCauldron: number;
  activeRecipe: IRecipe | null;
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
  };
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    started: true,
    cauldronIngredients: [],
    shelfStock: createStock(state.shelf),
    activeRecipe: pickRecipe("medium"),
  };
}

export function addToCauldron(state: GameState, id: string): GameState {
  if (!state.started) {
    return state;
  }

  const next = addIngredient(state, state.shelf, id);
  return {
    ...state,
    cauldronIngredients: next.cauldronIngredients,
    shelfStock: next.shelfStock,
  };
}
