import { RECIPES, type Difficulty, type IRecipe } from "../data/recipes";

export function pickRecipe(
  difficulty: Difficulty,
  random: () => number = Math.random,
): IRecipe {
  const pool = RECIPES.filter((recipe) => recipe.difficulty === difficulty);
  const index = Math.floor(random() * pool.length);
  const recipe = pool[index];

  if (!recipe) {
    throw new Error(`No recipes for difficulty ${difficulty}`);
  }

  return recipe;
}
