import type { IIngredient } from "../data/ingredients";

export interface CauldronState {
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
  maxInCauldron: number;
}

export function addIngredient(
  state: CauldronState,
  ingredients: readonly IIngredient[],
  id: string,
): CauldronState {
  if (state.cauldronIngredients.length >= state.maxInCauldron) {
    return state;
  }

  const stock = state.shelfStock[id];
  if (stock === undefined || stock <= 0) {
    return state;
  }

  const ingredient = ingredients.find((item) => item.id === id);
  if (!ingredient) {
    return state;
  }

  return {
    ...state,
    cauldronIngredients: [...state.cauldronIngredients, ingredient],
    shelfStock: {
      ...state.shelfStock,
      [id]: stock - 1,
    },
  };
}
