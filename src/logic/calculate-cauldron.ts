import type { IIngredient } from "../data/ingredients";
import type { IRecipeRange } from "../data/recipes";

export interface CauldronValues {
  temperature: number;
  density: number;
  magicPower: number;
}

export function calculateCauldron(
  ingredients: readonly IIngredient[],
): CauldronValues {
  const totals: CauldronValues = {
    temperature: 0,
    density: 0,
    magicPower: 0,
  };

  for (const ingredient of ingredients) {
    totals.temperature += ingredient.temperature;
    totals.density += ingredient.density;
    totals.magicPower += ingredient.magicPower;
  }

  return totals;
}

export function isInsideRange(value: number, range: IRecipeRange): boolean {
  return value >= range.min && value <= range.max;
}
