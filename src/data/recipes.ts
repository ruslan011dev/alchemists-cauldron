import type { Difficulty } from "./difficulty";

export type { Difficulty };

export interface IRecipeRange {
  min: number;
  max: number;
}

export interface IRecipe {
  id: string;
  name: string;
  difficulty: Difficulty;
  temperature: IRecipeRange;
  density: IRecipeRange;
  magicPower: IRecipeRange;
}

export const RECIPES: readonly IRecipe[] = [
  {
    id: "moon-mist",
    name: "Moon Mist",
    difficulty: "easy",
    temperature: { min: 32, max: 42 },
    density: { min: 12, max: 22 },
    magicPower: { min: 17, max: 27 },
  },
  {
    id: "root-bloom",
    name: "Root Bloom",
    difficulty: "easy",
    temperature: { min: 2, max: 12 },
    density: { min: 24, max: 34 },
    magicPower: { min: 15, max: 25 },
  },
  {
    id: "frost-steam",
    name: "Frost Steam",
    difficulty: "easy",
    temperature: { min: 2, max: 12 },
    density: { min: 7, max: 17 },
    magicPower: { min: 19, max: 29 },
  },
  {
    id: "quiet-swirl",
    name: "Quiet Swirl",
    difficulty: "easy",
    temperature: { min: -28, max: -18 },
    density: { min: 19, max: 29 },
    magicPower: { min: 17, max: 27 },
  },
  {
    id: "bright-dew",
    name: "Bright Dew",
    difficulty: "easy",
    temperature: { min: 27, max: 37 },
    density: { min: 32, max: 42 },
    magicPower: { min: 25, max: 35 },
  },
  {
    id: "snow-dust",
    name: "Snow Dust",
    difficulty: "easy",
    temperature: { min: -16, max: -6 },
    density: { min: 28, max: 38 },
    magicPower: { min: 29, max: 39 },
  },
  {
    id: "acid-spark",
    name: "Acid Spark",
    difficulty: "medium",
    temperature: { min: 17, max: 27 },
    density: { min: 18, max: 28 },
    magicPower: { min: 29, max: 39 },
  },
  {
    id: "void-ember",
    name: "Void Ember",
    difficulty: "medium",
    temperature: { min: 0, max: 10 },
    density: { min: 0, max: 10 },
    magicPower: { min: 45, max: 55 },
  },
  {
    id: "heavy-acid",
    name: "Heavy Acid",
    difficulty: "medium",
    temperature: { min: 0, max: 10 },
    density: { min: 29, max: 39 },
    magicPower: { min: 25, max: 35 },
  },
  {
    id: "frost-acid",
    name: "Frost Acid",
    difficulty: "medium",
    temperature: { min: -13, max: -3 },
    density: { min: 13, max: 23 },
    magicPower: { min: 31, max: 41 },
  },
  {
    id: "dusty-void",
    name: "Dusty Void",
    difficulty: "medium",
    temperature: { min: -13, max: -3 },
    density: { min: 0, max: 10 },
    magicPower: { min: 47, max: 57 },
  },
  {
    id: "dragon-void",
    name: "Dragon Void",
    difficulty: "medium",
    temperature: { min: 25, max: 35 },
    density: { min: 1, max: 11 },
    magicPower: { min: 55, max: 65 },
  },
  {
    id: "rooted-night",
    name: "Rooted Night",
    difficulty: "medium",
    temperature: { min: -18, max: -8 },
    density: { min: 14, max: 24 },
    magicPower: { min: 55, max: 65 },
  },
  {
    id: "phoenix-pulse",
    name: "Phoenix Pulse",
    difficulty: "hard",
    temperature: { min: 57, max: 67 },
    density: { min: 0, max: 10 },
    magicPower: { min: 37, max: 47 },
  },
  {
    id: "slime-crown",
    name: "Slime Crown",
    difficulty: "hard",
    temperature: { min: -5, max: 5 },
    density: { min: 45, max: 55 },
    magicPower: { min: 3, max: 13 },
  },
  {
    id: "void-flame",
    name: "Void Flame",
    difficulty: "hard",
    temperature: { min: 25, max: 35 },
    density: { min: 0, max: 10 },
    magicPower: { min: 60, max: 70 },
  },
  {
    id: "acid-bog",
    name: "Acid Bog",
    difficulty: "hard",
    temperature: { min: 10, max: 20 },
    density: { min: 39, max: 49 },
    magicPower: { min: 17, max: 27 },
  },
  {
    id: "frozen-ash",
    name: "Frozen Ash",
    difficulty: "hard",
    temperature: { min: 27, max: 37 },
    density: { min: 0, max: 10 },
    magicPower: { min: 39, max: 49 },
  },
  {
    id: "triple-eclipse",
    name: "Triple Eclipse",
    difficulty: "hard",
    temperature: { min: -20, max: -10 },
    density: { min: 19, max: 29 },
    magicPower: { min: 60, max: 70 },
  },
  {
    id: "ember-soup",
    name: "Ember Soup",
    difficulty: "hard",
    temperature: { min: 62, max: 72 },
    density: { min: 24, max: 34 },
    magicPower: { min: 37, max: 47 },
  },
];
