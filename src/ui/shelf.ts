import type { IIngredient } from "../data/ingredients";
import { canAddIngredient, type GameState } from "../state/game-state";
import { armIngredientDrag, shouldIgnoreDragClick } from "./drag";
import { createIngredientTooltip, placeTooltip } from "./tooltip";

function createCard(
  ingredient: IIngredient,
  stock: number,
  empty: boolean,
  blocked: boolean,
  onAdd: (id: string) => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "shelf-card";
  button.dataset.id = ingredient.id;

  if (empty) {
    button.classList.add("is-empty");
  }
  if (blocked && !empty) {
    button.classList.add("is-blocked");
  }

  const canDrag = !empty && !blocked;
  button.draggable = canDrag;
  button.disabled = empty;
  if (!canDrag) {
    button.tabIndex = -1;
  }
  if (blocked && !empty) {
    button.setAttribute("aria-disabled", "true");
  }

  const badge = document.createElement("span");
  badge.className = "stock-badge";
  badge.textContent = String(stock);
  button.append(badge);

  if (!empty) {
    const icon = document.createElement("img");
    icon.src = ingredient.icon;
    icon.alt = "";
    icon.draggable = false;
    icon.width = 48;
    icon.height = 48;

    const name = document.createElement("span");
    name.className = "shelf-name";
    name.textContent = ingredient.name;

    const tooltip = createIngredientTooltip(ingredient);
    button.setAttribute("aria-describedby", tooltip.id);
    button.append(icon, name, tooltip);
    const showTooltip = (): void => {
      tooltip.setAttribute("aria-hidden", "false");
      placeTooltip(button, tooltip);
    };
    const hideTooltip = (): void => {
      tooltip.setAttribute("aria-hidden", "true");
    };
    button.addEventListener("mouseenter", showTooltip);
    button.addEventListener("focus", showTooltip);
    button.addEventListener("mouseleave", hideTooltip);
    button.addEventListener("blur", hideTooltip);
    if (canDrag) {
      armIngredientDrag(button, ingredient.id);
    }
    button.addEventListener("click", () => {
      if (blocked || shouldIgnoreDragClick(button)) {
        return;
      }
      onAdd(ingredient.id);
    });
  } else {
    button.setAttribute("aria-label", "Empty");
  }

  return button;
}

export function renderShelf(
  parent: HTMLElement,
  state: GameState,
  onAdd: (id: string) => void,
): void {
  parent.replaceChildren();

  const blocked = state.started && !canAddIngredient(state);

  for (const ingredient of state.shelf) {
    const stock = state.shelfStock[ingredient.id] ?? 0;
    const empty = !state.started || stock <= 0;
    parent.append(
      createCard(ingredient, empty ? 0 : stock, empty, blocked, onAdd),
    );
  }
}
