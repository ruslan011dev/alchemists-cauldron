import type { UnlockId } from "./progress";

export type ThemeId = "classic" | "night-lab" | "parchment";

const THEME_UNLOCK: Partial<Record<ThemeId, UnlockId>> = {
  "night-lab": "theme-night-lab",
  parchment: "theme-parchment",
};

export function isThemeId(value: unknown): value is ThemeId {
  return value === "classic" || value === "night-lab" || value === "parchment";
}

export function canUseTheme(
  theme: ThemeId,
  unlocks: readonly UnlockId[],
): boolean {
  const required = THEME_UNLOCK[theme];
  return required === undefined || unlocks.includes(required);
}

export function resolveTheme(
  saved: string | null,
  unlocks: readonly UnlockId[],
): ThemeId {
  if (isThemeId(saved) && canUseTheme(saved, unlocks)) {
    return saved;
  }

  return "classic";
}
