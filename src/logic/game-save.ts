import { DIFFICULTY_SETTINGS, type Difficulty } from "../data/difficulty";
import { INGREDIENTS, type IIngredient } from "../data/ingredients";
import { RECIPES, type IRecipe } from "../data/recipes";
import { MAX_STOCK, isOutOfIngredients } from "./stock";

export type GameStatus = "playing" | "paused" | "finished";

export interface SavedGame {
  difficulty: Difficulty;
  score: number;
  timeLeft: number;
  lives: number;
  activeRecipe: IRecipe;
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
  status: GameStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function isStatus(value: unknown): value is GameStatus {
  return value === "playing" || value === "paused" || value === "finished";
}

function isInteger(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

export function isValidSave(data: unknown): SavedGame | null {
  if (
    !isRecord(data) ||
    !isDifficulty(data.difficulty) ||
    !isStatus(data.status)
  ) {
    return null;
  }

  const settings = DIFFICULTY_SETTINGS[data.difficulty];
  const shelf = INGREDIENTS.slice(0, settings.shelfCount);
  const finished = data.status === "finished";
  const score = data.score;
  const timeLeft = data.timeLeft;
  const lives = data.lives;

  if (
    !isInteger(score, 0, Number.MAX_SAFE_INTEGER) ||
    typeof timeLeft !== "number" ||
    !Number.isFinite(timeLeft) ||
    timeLeft < 0 ||
    timeLeft > settings.startingTime ||
    (!finished && timeLeft <= 0) ||
    !isInteger(lives, finished ? 0 : 1, settings.lives)
  ) {
    return null;
  }

  const recipeRecord = data.activeRecipe;
  if (!isRecord(recipeRecord) || typeof recipeRecord.id !== "string") {
    return null;
  }

  const recipeId = recipeRecord.id;
  const recipe = RECIPES.find((item) => item.id === recipeId);
  if (!recipe || recipe.difficulty !== data.difficulty) {
    return null;
  }

  if (
    !Array.isArray(data.cauldronIngredients) ||
    data.cauldronIngredients.length > settings.maxInCauldron
  ) {
    return null;
  }

  const cauldron: IIngredient[] = [];
  for (const value of data.cauldronIngredients) {
    if (typeof value !== "string") {
      return null;
    }

    const ingredient = shelf.find((item) => item.id === value);
    if (!ingredient) {
      return null;
    }

    cauldron.push(ingredient);
  }

  if (
    !isRecord(data.shelfStock) ||
    Object.keys(data.shelfStock).length !== shelf.length
  ) {
    return null;
  }

  const shelfStock: Record<string, number> = {};
  for (const ingredient of shelf) {
    const amount = data.shelfStock[ingredient.id];
    const used = cauldron.filter((item) => item.id === ingredient.id).length;
    if (!isInteger(amount, 0, MAX_STOCK) || amount + used > MAX_STOCK) {
      return null;
    }

    shelfStock[ingredient.id] = amount;
  }

  if (!finished && isOutOfIngredients(shelfStock, cauldron.length)) {
    return null;
  }

  return {
    difficulty: data.difficulty,
    score,
    timeLeft,
    lives,
    activeRecipe: recipe,
    cauldronIngredients: cauldron,
    shelfStock,
    status: data.status,
  };
}
