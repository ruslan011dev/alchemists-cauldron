import cauldronUrl from "../assets/cauldron.svg";
import { calculateCauldron } from "../logic/calculate-cauldron";
import {
  addToCauldron,
  createInitialState,
  startGame,
} from "../state/game-state";
import { renderBars } from "./bars";
import { renderCauldron } from "./cauldron";
import { renderShelf } from "./shelf";

export function renderApp(root: HTMLElement): void {
  let state = createInitialState();

  const title = document.createElement("h1");
  title.textContent = "Alchemist's Cauldron";

  const logo = document.createElement("img");
  logo.className = "logo";
  logo.src = cauldronUrl;
  logo.alt = "";
  logo.width = 64;
  logo.height = 64;

  const status = document.createElement("p");
  status.className = "status-line";

  const recipeName = document.createElement("p");
  recipeName.className = "recipe-name";

  const start = document.createElement("button");
  start.type = "button";
  start.className = "start-button";
  start.textContent = "Start Game";

  const bars = document.createElement("div");
  bars.className = "bars";

  const shelfTitle = document.createElement("h2");
  shelfTitle.textContent = "Shelf";
  const shelf = document.createElement("div");
  shelf.className = "shelf";

  const cauldronTitle = document.createElement("h2");
  cauldronTitle.textContent = "Cauldron";
  const cauldron = document.createElement("div");
  cauldron.className = "cauldron";

  root.replaceChildren(
    logo,
    title,
    status,
    recipeName,
    start,
    bars,
    shelfTitle,
    shelf,
    cauldronTitle,
    cauldron,
  );

  const paint = (): void => {
    status.textContent = `Score 0 · Time 0 · Ingredients: ${state.cauldronIngredients.length} / ${state.maxInCauldron}`;
    recipeName.textContent = state.activeRecipe
      ? `Recipe: ${state.activeRecipe.name}`
      : "";
    recipeName.hidden = !state.activeRecipe;
    start.hidden = state.started;

    renderBars(
      bars,
      calculateCauldron(state.cauldronIngredients),
      state.activeRecipe,
    );
    renderShelf(shelf, state, (id) => {
      state = addToCauldron(state, id);
      paint();
    });
    renderCauldron(cauldron, state.cauldronIngredients);
  };

  start.addEventListener("click", () => {
    state = startGame(state);
    paint();
  });

  paint();
}
