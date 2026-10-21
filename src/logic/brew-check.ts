import type { IRecipe, IRecipeRange } from "../data/recipes";
import { isInsideRange, type CauldronValues } from "./calculate-cauldron";

export function expandRange(
  range: IRecipeRange,
  tolerance: number,
): IRecipeRange {
  return {
    min: range.min - tolerance,
    max: range.max + tolerance,
  };
}

export function isBrewSuccess(
  values: CauldronValues,
  recipe: IRecipe,
  tolerance: number,
): boolean {
  return (
    isInsideRange(
      values.temperature,
      expandRange(recipe.temperature, tolerance),
    ) &&
    isInsideRange(values.density, expandRange(recipe.density, tolerance)) &&
    isInsideRange(values.magicPower, expandRange(recipe.magicPower, tolerance))
  );
}
