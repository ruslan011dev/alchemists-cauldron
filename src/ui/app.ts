import cauldronUrl from "../assets/cauldron.svg";
import { LEVEL_ONE } from "../data/difficulty";
import { calculateCauldron } from "../logic/calculate-cauldron";
import { formatTime, isUrgent, timerPercent } from "../logic/timer";
import {
  addToCauldron,
  brewPotion,
  createInitialState,
  exitToMenu,
  pauseGame,
  resumeGame,
  startGame,
  syncTime,
  type GameOverReason,
  type GameState,
} from "../state/game-state";
import { renderBars } from "./bars";
import { renderCauldron } from "./cauldron";
import { formatRange } from "./format";
import { renderShelf } from "./shelf";

const GAME_OVER_TEXT: Record<GameOverReason, string> = {
  time: "Time is up.",
  lives: "No lives left.",
  ingredients: "Out of ingredients.",
};

function brewMessage(state: GameState): string {
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

  const field = document.createElement("div");
  field.className = "game-field";

  const status = document.createElement("p");
  status.className = "status-line";

  const timer = document.createElement("div");
  timer.className = "timer";
  const timerValue = document.createElement("span");
  timerValue.className = "timer-value";
  const timerTrack = document.createElement("div");
  timerTrack.className = "timer-track";
  const timerFill = document.createElement("div");
  timerFill.className = "timer-fill";
  timerTrack.append(timerFill);
  timer.append(timerValue, timerTrack);

  const lives = document.createElement("div");
  lives.className = "lives";
  lives.setAttribute("aria-label", "Lives");
  for (let index = 0; index < LEVEL_ONE.lives; index += 1) {
    const life = document.createElement("span");
    life.className = "life";
    lives.append(life);
  }

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

  const pause = document.createElement("button");
  pause.type = "button";
  pause.className = "pause-button";
  pause.textContent = "Pause";

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

  field.append(
    status,
    timer,
    lives,
    start,
    pause,
    recipePanel,
    result,
    bars,
    shelfTitle,
    shelf,
    cauldronTitle,
    cauldron,
  );

  const pauseDialog = document.createElement("dialog");
  pauseDialog.className = "pause-dialog";
  const pauseCard = document.createElement("div");
  pauseCard.className = "pause-card";
  const pauseTitle = document.createElement("h2");
  pauseTitle.id = "pause-title";
  pauseTitle.textContent = "Game Paused";
  const resume = document.createElement("button");
  resume.type = "button";
  resume.className = "start-button";
  resume.textContent = "Resume";
  const exit = document.createElement("button");
  exit.type = "button";
  exit.className = "pause-exit";
  exit.textContent = "Exit to Menu";
  pauseCard.append(pauseTitle, resume, exit);
  pauseDialog.append(pauseCard);
  pauseDialog.setAttribute("aria-labelledby", "pause-title");

  const gameOver = document.createElement("section");
  gameOver.className = "game-over";
  const gameOverTitle = document.createElement("h2");
  gameOverTitle.textContent = "Game Over";
  const gameOverReason = document.createElement("p");
  gameOverReason.className = "game-over-reason";
  const gameOverScore = document.createElement("p");
  gameOverScore.className = "game-over-score";
  const playAgain = document.createElement("button");
  playAgain.type = "button";
  playAgain.className = "start-button";
  playAgain.textContent = "Play again";
  gameOver.append(gameOverTitle, gameOverReason, gameOverScore, playAgain);

  root.replaceChildren(logo, title, field, pauseDialog, gameOver);

  const updateClock = (timeLeft: number, playing: boolean): void => {
    timerValue.textContent = formatTime(timeLeft);
    timerFill.style.width = `${timerPercent(timeLeft, LEVEL_ONE.startingTime)}%`;
    timer.classList.toggle("is-urgent", playing && isUrgent(timeLeft));
  };

  const paint = (): void => {
    const recipe = state.activeRecipe;
    const over = state.gameOverReason !== null;
    const playing = state.started && !over && !state.paused;
    field.hidden = over;
    field.classList.toggle("is-paused", state.paused);
    field.inert = state.paused;
    gameOver.hidden = !over;
    status.textContent = state.started ? `Score ${state.score}` : "Score 0";
    start.hidden = state.started;
    pause.hidden = !playing;
    lives.hidden = !state.started;
    recipePanel.hidden = !recipe;

    for (const [index, life] of [...lives.children].entries()) {
      life.classList.toggle("is-spent", index >= state.lives);
    }

    if (recipe) {
      recipeTitle.textContent = recipe.name;
      ranges.textContent = `Temperature ${formatRange(recipe.temperature)} · Density ${formatRange(recipe.density)} · Magic Power ${formatRange(recipe.magicPower)}`;
    }

    const count = state.cauldronIngredients.length;
    counter.textContent = `Ingredients: ${count} / ${state.maxInCauldron}`;
    counter.classList.toggle("is-full", count >= state.maxInCauldron);
    brew.disabled = !playing || count === 0;
    result.textContent = brewMessage(state);
    updateClock(state.timeLeft, playing);

    if (state.gameOverReason) {
      gameOverReason.textContent = GAME_OVER_TEXT[state.gameOverReason];
      gameOverScore.textContent = `Score ${state.score}`;
    }

    renderBars(bars, calculateCauldron(state.cauldronIngredients), recipe);
    renderShelf(shelf, state, (id) => {
      state = addToCauldron(state, id);
      paint();
    });
    renderCauldron(cauldron, state.cauldronIngredients);

    if (state.paused && !pauseDialog.open) {
      pauseDialog.showModal();
    }
    if (!state.paused && pauseDialog.open) {
      pauseDialog.close();
    }
  };

  start.addEventListener("click", () => {
    state = startGame(state);
    paint();
  });

  playAgain.addEventListener("click", () => {
    state = startGame(state);
    paint();
  });

  brew.addEventListener("click", () => {
    state = brewPotion(state);
    paint();
  });

  pause.addEventListener("click", () => {
    state = pauseGame(state);
    paint();
  });

  resume.addEventListener("click", () => {
    state = resumeGame(state);
    paint();
  });

  exit.addEventListener("click", () => {
    state = exitToMenu();
    paint();
  });

  pauseDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      return;
    }

    const next = pauseGame(state);
    if (next === state) {
      return;
    }

    state = next;
    paint();
  });

  const watch = (): void => {
    requestAnimationFrame(watch);

    if (!state.started || state.paused || state.gameOverReason) {
      return;
    }

    const next = syncTime(state, Date.now());
    state = next;

    if (state.gameOverReason) {
      paint();
      return;
    }

    updateClock(state.timeLeft, true);
  };

  paint();
  requestAnimationFrame(watch);
}
