import {
  isValidSave,
  type GameStatus,
  type SavedGame,
} from "../logic/game-save";
import type { GameState } from "../state/game-state";

const SAVE_KEY = "alchemists-cauldron.save";

function statusOf(state: GameState): GameStatus {
  if (state.gameOverReason) {
    return "finished";
  }

  if (state.paused) {
    return "paused";
  }

  return "playing";
}

export function saveGame(state: GameState): boolean {
  const recipe = state.activeRecipe;
  if (!state.started || !recipe) {
    return false;
  }

  const payload = {
    difficulty: state.difficulty,
    score: state.score,
    timeLeft: state.timeLeft,
    lives: state.lives,
    activeRecipe: { id: recipe.id },
    cauldronIngredients: state.cauldronIngredients.map((item) => item.id),
    shelfStock: state.shelfStock,
    status: statusOf(state),
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    const save = isValidSave(parsed);
    if (!save) {
      clearSave();
      return null;
    }

    if (save.status === "finished") {
      return null;
    }

    return save;
  } catch {
    clearSave();
    return null;
  }
}

export function clearSave(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}
