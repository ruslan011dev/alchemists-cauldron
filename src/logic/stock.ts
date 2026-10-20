import type { IIngredient } from "../data/ingredients";

const MIN_STOCK = 2;
const STOCK_SPAN = 14;

export function createStock(
  ingredients: readonly IIngredient[],
): Record<string, number> {
  const stock: Record<string, number> = {};

  for (const ingredient of ingredients) {
    stock[ingredient.id] = Math.floor(Math.random() * STOCK_SPAN) + MIN_STOCK;
  }

  return stock;
}
