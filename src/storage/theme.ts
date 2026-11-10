import { isThemeId, type ThemeId } from "../logic/theme";

const THEME_KEY = "alchemists-cauldron.theme";

export function loadSavedTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function saveTheme(theme: ThemeId): boolean {
  if (!isThemeId(theme)) {
    return false;
  }

  try {
    localStorage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
