import type { IIngredient } from "../data/ingredients";
import type { GameState } from "../state/game-state";
import { formatSigned } from "./format";

function appendStat(parent: HTMLElement, label: string, value: number): void {
  const stat = document.createElement("span");
  stat.className = "shelf-stat";

  const name = document.createElement("span");
  name.className = "shelf-stat-label";
  name.textContent = label;

  const number = document.createElement("span");
  number.textContent = formatSigned(value);

  stat.append(name, number);
  parent.append(stat);
}

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

  button.disabled = empty || blocked;
  if (button.disabled) {
    button.tabIndex = -1;
  }

  const badge = document.createElement("span");
  badge.className = "stock-badge";
  badge.textContent = String(stock);
  button.append(badge);

  if (!empty) {
    const icon = document.createElement("img");
    icon.src = ingredient.icon;
    icon.alt = "";
    icon.width = 48;
    icon.height = 48;

    const name = document.createElement("span");
    name.className = "shelf-name";
    name.textContent = ingredient.name;

    const stats = document.createElement("span");
    stats.className = "shelf-stats";
    appendStat(stats, "Temperature", ingredient.temperature);
    appendStat(stats, "Density", ingredient.density);
    appendStat(stats, "Magic", ingredient.magicPower);

    button.append(icon, name, stats);
    button.addEventListener("click", () => {
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

  const full =
    state.cauldronIngredients.length >= state.maxInCauldron ||
    (state.started && state.lives <= 0);

  for (const ingredient of state.shelf) {
    const stock = state.shelfStock[ingredient.id] ?? 0;
    const empty = !state.started || stock <= 0;
    parent.append(
      createCard(ingredient, empty ? 0 : stock, empty, full, onAdd),
    );
  }
}
