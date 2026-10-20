import type { IIngredient } from "../data/ingredients";
import { formatSigned } from "./format";

export function renderCauldron(
  parent: HTMLElement,
  ingredients: readonly IIngredient[],
): void {
  parent.replaceChildren();

  if (ingredients.length === 0) {
    const empty = document.createElement("p");
    empty.className = "cauldron-empty";
    empty.textContent = "The cauldron is empty.";
    parent.append(empty);
    return;
  }

  const list = document.createElement("ol");
  list.className = "cauldron-list";

  for (const ingredient of ingredients) {
    const item = document.createElement("li");
    item.textContent = `${ingredient.name} (${formatSigned(ingredient.temperature)}, ${formatSigned(ingredient.density)}, ${formatSigned(ingredient.magicPower)})`;
    list.append(item);
  }

  parent.append(list);
}
