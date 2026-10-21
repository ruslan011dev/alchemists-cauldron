import cauldronUrl from "../assets/cauldron.svg";
import {
  DIFFICULTIES,
  DIFFICULTY_SETTINGS,
  difficultyButtonText,
} from "../data/difficulty";
import { calculateCauldron } from "../logic/calculate-cauldron";
import { isTopTenScore, isValidName } from "../logic/leaderboard";
import { formatTime, isUrgent, timerPercent } from "../logic/timer";
import { clearSave, loadGame, saveGame } from "../storage/game-save";
import {
  addScore,
  clearLeaderboard,
  loadLeaderboard,
} from "../storage/leaderboard";
import {
  addToCauldron,
  brewPotion,
  continueGame,
  createInitialState,
  exitToMenu,
  pauseGame,
  resumeGame,
  selectDifficulty,
  startGame,
  syncTime,
  type GameOverReason,
  type GameState,
} from "../state/game-state";
import { renderBars } from "./bars";
import { renderCauldron } from "./cauldron";
import { formatRange } from "./format";
import { renderLeaderboard } from "./leaderboard";
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

const NAME_ERROR = "Use 2–15 letters, digits, spaces, _ or -.";

export function renderApp(root: HTMLElement): void {
  let state = createInitialState();
  let showLeaderboard = false;
  let scoreSaved = false;
  let hasContinue = loadGame() !== null;

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

  const continueButton = document.createElement("button");
  continueButton.type = "button";
  continueButton.className = "start-button";
  continueButton.textContent = "Continue Game";

  const start = document.createElement("button");
  start.type = "button";
  start.className = "start-button";
  start.textContent = "Start Game";

  const openBoard = document.createElement("button");
  openBoard.type = "button";
  openBoard.className = "pause-button";
  openBoard.textContent = "Leaderboard";

  const helpButton = document.createElement("button");
  helpButton.type = "button";
  helpButton.className = "pause-button";
  helpButton.textContent = "Help";

  const settingsButton = document.createElement("button");
  settingsButton.type = "button";
  settingsButton.className = "pause-button";
  settingsButton.textContent = "Settings";

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
    continueButton,
    start,
    helpButton,
    settingsButton,
    openBoard,
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
  const nameForm = document.createElement("form");
  nameForm.className = "name-form";
  const nameLabel = document.createElement("label");
  nameLabel.className = "name-label";
  nameLabel.textContent = "Enter your name (2–15 characters)";
  const nameInput = document.createElement("input");
  nameInput.className = "name-input";
  nameInput.maxLength = 15;
  nameInput.setAttribute("autocomplete", "nickname");
  const nameError = document.createElement("p");
  nameError.className = "name-error";
  const submitScore = document.createElement("button");
  submitScore.type = "submit";
  submitScore.className = "start-button";
  submitScore.textContent = "Submit score";
  nameLabel.append(nameInput);
  nameForm.append(nameLabel, nameError, submitScore);

  const gameOverActions = document.createElement("div");
  gameOverActions.className = "game-over-actions";
  const playAgain = document.createElement("button");
  playAgain.type = "button";
  playAgain.className = "start-button";
  playAgain.textContent = "Play again";
  const openBoardFromOver = document.createElement("button");
  openBoardFromOver.type = "button";
  openBoardFromOver.className = "pause-button";
  openBoardFromOver.textContent = "Leaderboard";
  gameOverActions.append(playAgain, openBoardFromOver);
  gameOver.append(
    gameOverTitle,
    gameOverReason,
    gameOverScore,
    nameForm,
    gameOverActions,
  );

  const board = document.createElement("section");
  board.className = "leaderboard";
  const boardTitle = document.createElement("h2");
  boardTitle.textContent = "Leaderboard";
  const boardMessage = document.createElement("p");
  boardMessage.className = "board-message";
  const tableWrap = document.createElement("div");
  tableWrap.className = "leaderboard-wrap";
  const table = document.createElement("table");
  table.className = "leaderboard-table";
  const tableHead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Rank", "Name", "Score", "Difficulty", "Date"]) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = label;
    headRow.append(cell);
  }
  tableHead.append(headRow);
  const tableBody = document.createElement("tbody");
  table.append(tableHead, tableBody);
  tableWrap.append(table);
  const boardActions = document.createElement("div");
  boardActions.className = "game-over-actions";
  const clearBoard = document.createElement("button");
  clearBoard.type = "button";
  clearBoard.className = "pause-button";
  clearBoard.textContent = "Clear Leaderboard";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "start-button";
  back.textContent = "Back";
  boardActions.append(clearBoard, back);
  board.append(boardTitle, boardMessage, tableWrap, boardActions);

  const confirmDialog = document.createElement("dialog");
  confirmDialog.className = "pause-dialog";
  const confirmCard = document.createElement("div");
  confirmCard.className = "pause-card";
  const confirmTitle = document.createElement("h2");
  confirmTitle.id = "clear-title";
  confirmTitle.textContent = "Clear the leaderboard?";
  const confirmClear = document.createElement("button");
  confirmClear.type = "button";
  confirmClear.className = "start-button";
  confirmClear.textContent = "Clear";
  const confirmCancel = document.createElement("button");
  confirmCancel.type = "button";
  confirmCancel.className = "pause-exit";
  confirmCancel.textContent = "Cancel";
  confirmCard.append(confirmTitle, confirmClear, confirmCancel);
  confirmDialog.append(confirmCard);
  confirmDialog.setAttribute("aria-labelledby", "clear-title");

  const helpDialog = document.createElement("dialog");
  helpDialog.className = "pause-dialog";
  const helpCard = document.createElement("div");
  helpCard.className = "pause-card";
  const helpTitle = document.createElement("h2");
  helpTitle.id = "help-title";
  helpTitle.textContent = "Game rules";
  const helpClose = document.createElement("button");
  helpClose.type = "button";
  helpClose.className = "start-button";
  helpClose.textContent = "Close";
  for (const text of [
    "Add ingredients from the shelf until Temperature, Density and Magic Power fit the recipe. Brew allows a tolerance around each range.",
    "Stock is spent when an ingredient goes into the cauldron. A successful brew scores points and adds time, never above the start time. A failed brew costs a life.",
    "The run ends when time runs out, lives reach 0, or the shelf and the cauldron are both empty. Pause stops the clock. An unfinished game can be continued after the page is reloaded.",
  ]) {
    const paragraph = document.createElement("p");
    paragraph.className = "rules-text";
    paragraph.textContent = text;
    helpCard.append(paragraph);
  }
  helpCard.prepend(helpTitle);
  helpCard.append(helpClose);
  helpDialog.append(helpCard);
  helpDialog.setAttribute("aria-labelledby", "help-title");

  const settingsDialog = document.createElement("dialog");
  settingsDialog.className = "pause-dialog";
  const settingsCard = document.createElement("div");
  settingsCard.className = "pause-card";
  const settingsTitle = document.createElement("h2");
  settingsTitle.id = "settings-title";
  settingsTitle.textContent = "Difficulty";
  const difficultyButtons: HTMLButtonElement[] = [];
  for (const difficulty of DIFFICULTIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pause-button difficulty-button";
    button.dataset.difficulty = difficulty;
    button.textContent = difficultyButtonText(difficulty);
    difficultyButtons.push(button);
    settingsCard.append(button);
  }
  const settingsClose = document.createElement("button");
  settingsClose.type = "button";
  settingsClose.className = "start-button";
  settingsClose.textContent = "Close";
  settingsCard.prepend(settingsTitle);
  settingsCard.append(settingsClose);
  settingsDialog.append(settingsCard);
  settingsDialog.setAttribute("aria-labelledby", "settings-title");

  root.replaceChildren(
    logo,
    title,
    field,
    pauseDialog,
    gameOver,
    board,
    confirmDialog,
    helpDialog,
    settingsDialog,
  );

  const updateClock = (timeLeft: number, playing: boolean): void => {
    timerValue.textContent = formatTime(timeLeft);
    timerFill.style.width = `${timerPercent(timeLeft, DIFFICULTY_SETTINGS[state.difficulty].startingTime)}%`;
    timer.classList.toggle("is-urgent", playing && isUrgent(timeLeft));
  };

  const paint = (): void => {
    const recipe = state.activeRecipe;
    const over = state.gameOverReason !== null;
    const playing = state.started && !over && !state.paused && !showLeaderboard;
    field.hidden = over || showLeaderboard;
    field.classList.toggle("is-paused", state.paused);
    field.inert = state.paused;
    gameOver.hidden = !over || showLeaderboard;
    board.hidden = !showLeaderboard;
    status.textContent = state.started ? `Score ${state.score}` : "Score 0";
    continueButton.hidden = state.started || !hasContinue;
    start.hidden = state.started;
    helpButton.hidden = state.started;
    settingsButton.hidden = state.started;
    openBoard.hidden = state.started;
    pause.hidden = !playing;
    const maxLives = DIFFICULTY_SETTINGS[state.difficulty].lives;
    if (lives.children.length !== maxLives) {
      lives.replaceChildren();
      for (let index = 0; index < maxLives; index += 1) {
        const life = document.createElement("span");
        life.className = "life";
        lives.append(life);
      }
    }
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
      gameOverScore.textContent = `Final score: ${state.score}`;
      nameForm.hidden =
        scoreSaved ||
        !isTopTenScore(loadLeaderboard(state.difficulty), state.score);
    }

    for (const button of difficultyButtons) {
      button.classList.toggle(
        "is-selected",
        button.dataset.difficulty === state.difficulty,
      );
    }

    if (showLeaderboard) {
      renderLeaderboard(tableBody, loadLeaderboard(state.difficulty));
      boardMessage.hidden = boardMessage.textContent === "";
    }

    renderBars(bars, calculateCauldron(state.cauldronIngredients), recipe);
    renderShelf(shelf, state, (id) => {
      state = addToCauldron(state, id);
      remember();
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

  const remember = (): void => {
    if (!state.started) {
      return;
    }

    saveGame(state);
    hasContinue = state.gameOverReason === null;
  };

  const beginRun = (): void => {
    scoreSaved = false;
    showLeaderboard = false;
    nameInput.value = "";
    nameError.textContent = "";
    state = startGame(state);
    remember();
    paint();
  };

  start.addEventListener("click", beginRun);
  playAgain.addEventListener("click", beginRun);

  continueButton.addEventListener("click", () => {
    const save = loadGame();
    if (!save) {
      hasContinue = false;
      paint();
      return;
    }

    scoreSaved = false;
    showLeaderboard = false;
    nameInput.value = "";
    nameError.textContent = "";
    state = continueGame(save);
    remember();
    paint();
  });

  brew.addEventListener("click", () => {
    state = brewPotion(state);
    remember();
    paint();
  });

  pause.addEventListener("click", () => {
    state = pauseGame(state);
    remember();
    paint();
  });

  resume.addEventListener("click", () => {
    state = resumeGame(state);
    remember();
    paint();
  });

  exit.addEventListener("click", () => {
    scoreSaved = false;
    showLeaderboard = false;
    nameInput.value = "";
    nameError.textContent = "";
    hasContinue = !clearSave() && loadGame() !== null;
    state = exitToMenu(state);
    paint();
  });

  const openLeaderboard = (): void => {
    showLeaderboard = true;
    boardMessage.textContent = "";
    paint();
  };

  openBoard.addEventListener("click", openLeaderboard);
  openBoardFromOver.addEventListener("click", openLeaderboard);

  back.addEventListener("click", () => {
    showLeaderboard = false;
    paint();
  });

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.gameOverReason || scoreSaved) {
      return;
    }

    if (!isValidName(nameInput.value)) {
      nameError.textContent = NAME_ERROR;
      return;
    }

    if (!addScore(nameInput.value, state.score, state.difficulty)) {
      nameError.textContent = "Could not save the score.";
      return;
    }

    scoreSaved = true;
    nameInput.value = "";
    nameError.textContent = "";
    paint();
  });

  clearBoard.addEventListener("click", () => {
    if (!confirmDialog.open) {
      confirmDialog.showModal();
    }
  });

  confirmCancel.addEventListener("click", () => {
    confirmDialog.close();
  });

  confirmClear.addEventListener("click", () => {
    boardMessage.textContent = clearLeaderboard(state.difficulty)
      ? ""
      : "Could not clear the leaderboard.";
    confirmDialog.close();
    paint();
  });

  helpButton.addEventListener("click", () => {
    if (!helpDialog.open) {
      helpDialog.showModal();
    }
  });

  helpClose.addEventListener("click", () => {
    helpDialog.close();
  });

  settingsButton.addEventListener("click", () => {
    if (!state.started && !settingsDialog.open) {
      settingsDialog.showModal();
    }
  });

  settingsClose.addEventListener("click", () => {
    settingsDialog.close();
  });

  for (const button of difficultyButtons) {
    button.addEventListener("click", () => {
      const difficulty = button.dataset.difficulty;
      if (
        difficulty !== "easy" &&
        difficulty !== "medium" &&
        difficulty !== "hard"
      ) {
        return;
      }

      state = selectDifficulty(state, difficulty);
      paint();
    });
  }

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
    remember();
    paint();
  });

  window.addEventListener("pagehide", () => {
    if (!state.started) {
      return;
    }

    state = syncTime(state, Date.now());
    saveGame(state);
  });

  const watch = (): void => {
    requestAnimationFrame(watch);

    if (!state.started || state.paused || state.gameOverReason) {
      return;
    }

    const next = syncTime(state, Date.now());
    state = next;

    if (state.gameOverReason) {
      remember();
      paint();
      return;
    }

    updateClock(state.timeLeft, true);
  };

  paint();
  requestAnimationFrame(watch);
}
