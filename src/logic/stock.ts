import type { IIngredient } from "../data/ingredients";

const MIN_STOCK = 2;
const STOCK_SPAN = 14;
export const MAX_STOCK = MIN_STOCK + STOCK_SPAN - 1;

export function createStock(
  ingredients: readonly IIngredient[],
): Record<string, number> {
  const stock: Record<string, number> = {};

  for (const ingredient of ingredients) {
    stock[ingredient.id] = Math.floor(Math.random() * STOCK_SPAN) + MIN_STOCK;
  }

  return stock;
}

export function isOutOfIngredients(
  shelfStock: Record<string, number>,
  cauldronCount: number,
): boolean {
  if (cauldronCount > 0) {
    return false;
  }

  return Object.values(shelfStock).every((stock) => stock <= 0);
}
