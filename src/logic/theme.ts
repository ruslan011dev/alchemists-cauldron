export type ThemeId = "classic" | "night-lab" | "parchment";

export function isThemeId(value: unknown): value is ThemeId {
  return value === "classic" || value === "night-lab" || value === "parchment";
}

export function canUseTheme(theme: ThemeId): boolean {
  return isThemeId(theme);
}

export function resolveTheme(saved: string | null): ThemeId {
  if (isThemeId(saved)) {
    return saved;
  }

  return "classic";
}
