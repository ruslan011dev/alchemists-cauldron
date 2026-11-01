import { resolveTheme, type ThemeId } from "../logic/theme";
import type { UnlockId } from "../logic/progress";
import { loadSavedTheme, saveTheme } from "../storage/theme";

export function applyTheme(theme: ThemeId): void {
  if (theme === "classic") {
    delete document.documentElement.dataset.theme;
    return;
  }

  document.documentElement.dataset.theme = theme;
}

export function applySavedTheme(unlocks: readonly UnlockId[]): ThemeId {
  const theme = resolveTheme(loadSavedTheme(), unlocks);
  applyTheme(theme);
  return theme;
}

export function chooseTheme(
  theme: ThemeId,
  unlocks: readonly UnlockId[],
): boolean {
  const next = resolveTheme(theme, unlocks);
  if (next !== theme || !saveTheme(next)) {
    return false;
  }

  applyTheme(next);
  return true;
}
