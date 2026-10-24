import { reactionsFor, type IReaction } from "../data/reactions";
import type { Difficulty } from "../data/difficulty";
import type { IIngredient } from "../data/ingredients";
import { calculateCauldron, type CauldronValues } from "./calculate-cauldron";

export function applyActiveReactions(
  ingredients: readonly IIngredient[],
  reactions: readonly IReaction[],
): CauldronValues {
  return reactions.reduce((values, reaction) => {
    if (!reaction.isActive(ingredients)) {
      return values;
    }

    return reaction.apply(values);
  }, calculateCauldron(ingredients));
}

export function firedReactions(
  before: readonly IIngredient[],
  after: readonly IIngredient[],
  reactions: readonly IReaction[],
): IReaction[] {
  return reactions.filter((reaction) => {
    return !reaction.isActive(before) && reaction.isActive(after);
  });
}

export function activeReactionNames(
  ingredients: readonly IIngredient[],
  difficulty: Difficulty,
): string[] {
  return reactionsFor(difficulty)
    .filter((reaction) => reaction.isActive(ingredients))
    .map((reaction) => reaction.name);
}

export function cauldronValues(
  ingredients: readonly IIngredient[],
  difficulty: Difficulty,
): CauldronValues {
  return applyActiveReactions(ingredients, reactionsFor(difficulty));
}
