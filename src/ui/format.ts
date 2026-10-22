import type { IRecipeRange } from "../data/recipes";

export function formatRange(range: IRecipeRange): string {
  return `${range.min}..${range.max}`;
}

export function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
