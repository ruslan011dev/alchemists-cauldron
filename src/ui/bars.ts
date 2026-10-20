import type { IRecipe, IRecipeRange } from "../data/recipes";
import {
  isInsideRange,
  type CauldronValues,
} from "../logic/calculate-cauldron";
import { formatSigned } from "./format";

const SCALE_MIN = -80;
const SCALE_MAX = 160;

interface BarSpec {
  key: keyof CauldronValues;
  label: string;
}

const BARS: readonly BarSpec[] = [
  { key: "temperature", label: "Temperature" },
  { key: "density", label: "Density" },
  { key: "magicPower", label: "Magic Power" },
];

function toPercent(value: number): number {
  const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));
  return ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
}

function placeZone(zone: HTMLElement, range: IRecipeRange | null): void {
  if (!range) {
    zone.hidden = true;
    return;
  }

  const start = toPercent(range.min);
  const end = toPercent(range.max);
  zone.hidden = false;
  zone.style.left = `${start}%`;
  zone.style.width = `${end - start}%`;
}

export function renderBars(
  parent: HTMLElement,
  values: CauldronValues,
  recipe: IRecipe | null,
): void {
  if (parent.childElementCount === 0) {
    const zeroPercent = toPercent(0);

    for (const spec of BARS) {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.dataset.bar = spec.key;

      const label = document.createElement("div");
      label.className = "bar-label";

      const name = document.createElement("span");
      name.textContent = spec.label;

      const reading = document.createElement("span");
      reading.className = "bar-value";

      label.append(name, reading);

      const track = document.createElement("div");
      track.className = "bar-track";

      const zone = document.createElement("div");
      zone.className = "bar-zone";

      const zero = document.createElement("div");
      zero.className = "bar-zero";
      zero.style.left = `${zeroPercent}%`;

      const marker = document.createElement("div");
      marker.className = "bar-marker";

      track.append(zone, zero, marker);
      bar.append(label, track);
      parent.append(bar);
    }
  }

  for (const spec of BARS) {
    const bar = parent.querySelector<HTMLElement>(`[data-bar="${spec.key}"]`);
    const value = values[spec.key];
    const range = recipe?.[spec.key] ?? null;
    const inside = range !== null && isInsideRange(value, range);

    if (!bar) {
      continue;
    }

    bar.classList.toggle("is-in-range", inside);

    const reading = bar.querySelector(".bar-value");
    if (reading) {
      reading.textContent = formatSigned(value);
    }

    const zone = bar.querySelector<HTMLElement>(".bar-zone");
    if (zone) {
      placeZone(zone, range);
    }

    const marker = bar.querySelector<HTMLElement>(".bar-marker");
    if (marker) {
      marker.style.left = `${toPercent(value)}%`;
    }
  }
}
