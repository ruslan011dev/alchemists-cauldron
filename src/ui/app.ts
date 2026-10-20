import cauldronUrl from "../assets/cauldron.svg";
import {
  addToCauldron,
  createInitialState,
  startGame,
  type GameState,
} from "../state/game-state";
import { renderCauldron } from "./cauldron";
import { renderShelf } from "./shelf";

function renderStatus(state: GameState): HTMLElement {
  const status = document.createElement("p");
  status.className = "status-line";
  status.textContent = `Score 0 · Time 0 · Ingredients: ${state.cauldronIngredients.length} / ${state.maxInCauldron}`;
  return status;
}

export function renderApp(root: HTMLElement): void {
  let state = createInitialState();

  const paint = (): void => {
    const icon = document.createElement("img");
    icon.className = "logo";
    icon.src = cauldronUrl;
    icon.alt = "";
    icon.width = 64;
    icon.height = 64;

    const title = document.createElement("h1");
    title.textContent = "Alchemist's Cauldron";

    const shelfTitle = document.createElement("h2");
    shelfTitle.textContent = "Shelf";
    const shelf = document.createElement("div");
    shelf.className = "shelf";
    renderShelf(shelf, state, (id) => {
      state = addToCauldron(state, id);
      paint();
    });

    const cauldronTitle = document.createElement("h2");
    cauldronTitle.textContent = "Cauldron";
    const cauldron = document.createElement("div");
    cauldron.className = "cauldron";
    renderCauldron(cauldron, state.cauldronIngredients);

    const parts: HTMLElement[] = [icon, title, renderStatus(state)];

    if (!state.started) {
      const start = document.createElement("button");
      start.type = "button";
      start.className = "start-button";
      start.textContent = "Start Game";
      start.addEventListener("click", () => {
        state = startGame(state);
        paint();
      });
      parts.push(start);
    }

    parts.push(shelfTitle, shelf, cauldronTitle, cauldron);
    root.replaceChildren(...parts);
  };

  paint();
}
