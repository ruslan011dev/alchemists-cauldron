import cauldronUrl from "../assets/cauldron.svg";
import { calculateCauldron } from "../logic/calculate-cauldron";
import {
  addToCauldron,
  brewPotion,
  createInitialState,
  startGame,
  type GameState,
} from "../state/game-state";
import { renderBars } from "./bars";
import { renderCauldron } from "./cauldron";
import { formatRange } from "./format";
import { renderShelf } from "./shelf";

function brewMessage(state: GameState): string {
  if (state.started && state.lives <= 0) {
    return "No lives left.";
  }

  if (state.lastBrew === "success") {
    return "The brew succeeded.";
  }

  if (state.lastBrew === "failure") {
    return "The brew failed.";
  }

  return "";
}

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

  const recipePanel = document.createElement("section");
  recipePanel.className = "recipe-panel";

  const recipeTitle = document.createElement("h2");
  recipeTitle.className = "recipe-title";

  const ranges = document.createElement("p");
  ranges.className = "recipe-ranges";

  const counter = document.createElement("p");
  counter.className = "ingredient-counter";

  const brew = document.createElement("button");
  brew.type = "button";
  brew.className = "brew-button";
  brew.textContent = "Brew";

  recipePanel.append(recipeTitle, ranges, counter, brew);

  const result = document.createElement("p");
  result.className = "brew-result";

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
    start,
    recipePanel,
    result,
    bars,
    shelfTitle,
    shelf,
    cauldronTitle,
    cauldron,
  );

  const paint = (): void => {
    const recipe = state.activeRecipe;
    status.textContent = state.started
      ? `Score ${state.score} · Time ${state.timeLeft} · Lives ${state.lives}`
      : "Score 0 · Time 0";
    start.hidden = state.started;
    recipePanel.hidden = !recipe;

    if (recipe) {
      recipeTitle.textContent = recipe.name;
      ranges.textContent = `Temperature ${formatRange(recipe.temperature)} · Density ${formatRange(recipe.density)} · Magic Power ${formatRange(recipe.magicPower)}`;
    }

    const count = state.cauldronIngredients.length;
    counter.textContent = `Ingredients: ${count} / ${state.maxInCauldron}`;
    counter.classList.toggle("is-full", count >= state.maxInCauldron);
    brew.disabled = !state.started || state.lives <= 0 || count === 0;
    result.textContent = brewMessage(state);

    renderBars(bars, calculateCauldron(state.cauldronIngredients), recipe);
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

  brew.addEventListener("click", () => {
    state = brewPotion(state);
    paint();
  });

  paint();
}
