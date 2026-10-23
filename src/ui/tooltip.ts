import type { IIngredient } from "../data/ingredients";

const EDGE_GAP = 8;

function formatBaseValue(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  if (value < 0) {
    return `−${Math.abs(value)}`;
  }

  return "0";
}

function appendStat(parent: HTMLElement, label: string, value: number): void {
  const stat = document.createElement("span");
  stat.className = "shelf-stat";

  const name = document.createElement("span");
  name.className = "shelf-stat-label";
  name.textContent = label;

  const number = document.createElement("span");
  number.textContent = formatBaseValue(value);

  stat.append(name, number);
  parent.append(stat);
}

export function createIngredientTooltip(ingredient: IIngredient): HTMLElement {
  const tooltip = document.createElement("span");
  tooltip.className = "tooltip";
  tooltip.id = `tip-${ingredient.id}`;
  tooltip.setAttribute("role", "tooltip");
  tooltip.setAttribute("aria-hidden", "true");
  appendStat(tooltip, "Temperature", ingredient.temperature);
  appendStat(tooltip, "Density", ingredient.density);
  appendStat(tooltip, "Magic Power", ingredient.magicPower);
  return tooltip;
}

export function placeTooltip(card: HTMLElement, tooltip: HTMLElement): void {
  tooltip.classList.remove("tooltip--left", "tooltip--up");
  const cardRect = card.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const nearRight =
    cardRect.right + EDGE_GAP + tipRect.width > window.innerWidth;
  const nearBottom =
    window.innerHeight - cardRect.bottom < tipRect.height + EDGE_GAP;
  tooltip.classList.toggle("tooltip--left", nearRight);
  tooltip.classList.toggle("tooltip--up", nearBottom);
}
