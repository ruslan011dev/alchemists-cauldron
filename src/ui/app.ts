import cauldronUrl from "../assets/cauldron.svg";
import {
  DIFFICULTIES,
  DIFFICULTY_SETTINGS,
  difficultyButtonText,
} from "../data/difficulty";
import { reactionName } from "../data/reactions";
import { isTopTenScore, isValidName } from "../logic/leaderboard";
import { activeReactionNames, cauldronValues } from "../logic/reactions";
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
  canAddIngredient,
  continueGame,
  createInitialState,
  exitToMenu,
  pauseGame,
  pourOut,
  resumeGame,
  selectDifficulty,
  startGame,
  syncTime,
  type GameOverReason,
  type GameState,
} from "../state/game-state";
import { renderBars } from "./bars";
import { renderCauldron } from "./cauldron";
import { bindCauldronDrop, suppressNextClick } from "./drag";
import { formatRange } from "./format";
import { renderLeaderboard } from "./leaderboard";
import { shortcutFromEvent, type PlayGate } from "./keyboard";
import { renderShelf } from "./shelf";

const GAME_OVER_TEXT: Record<GameOverReason, string> = {
  time: "Time is up.",
  lives: "No lives left.",
  ingredients: "Out of ingredients.",
};

const GAME_OVER_KICKER: Record<GameOverReason, string> = {
  time: "The fire dies down",
  lives: "The brew turns against you",
  ingredients: "The shelf is bare",
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
  const titleKicker = document.createElement("span");
  titleKicker.className = "title-line title-line--kicker";
  titleKicker.textContent = "Alchemist's";
  const titleMain = document.createElement("span");
  titleMain.className = "title-line title-line--main";
  titleMain.textContent = "Cauldron";
  title.append(titleKicker, titleMain);

  const logo = document.createElement("img");
  logo.className = "logo";
  logo.src = cauldronUrl;
  logo.alt = "";
  logo.width = 64;
  logo.height = 64;

  const masthead = document.createElement("header");
  masthead.className = "masthead";
  masthead.append(logo, title);

  const field = document.createElement("div");
  field.className = "game-field";

  const status = document.createElement("p");
  status.className = "status-line";
  const scoreLabel = document.createElement("span");
  scoreLabel.className = "stat-label";
  scoreLabel.textContent = "Score";
  const scoreValue = document.createElement("span");
  scoreValue.className = "stat-value";
  status.append(scoreLabel, scoreValue);

  const timer = document.createElement("div");
  timer.className = "timer";
  const timerLabel = document.createElement("span");
  timerLabel.className = "stat-label";
  timerLabel.textContent = "Time";
  const timerValue = document.createElement("span");
  timerValue.className = "timer-value";
  const timerTrack = document.createElement("div");
  timerTrack.className = "timer-track";
  const timerFill = document.createElement("div");
  timerFill.className = "timer-fill";
  timerTrack.append(timerFill);
  timer.append(timerLabel, timerValue, timerTrack);

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
  const pour = document.createElement("button");
  pour.type = "button";
  pour.className = "pour-button";
  pour.textContent = "Pour Out";
  const recipeActions = document.createElement("div");
  recipeActions.className = "recipe-actions";
  recipeActions.append(brew, pour);
  recipePanel.append(recipeTitle, ranges, counter, recipeActions);

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
  shelfTitle.className = "panel-title";
  shelfTitle.textContent = "Shelf";
  const shelf = document.createElement("div");
  shelf.className = "shelf";
  const cauldronTitle = document.createElement("h2");
  cauldronTitle.className = "panel-title";
  cauldronTitle.textContent = "Cauldron";
  const cauldron = document.createElement("div");
  cauldron.className = "cauldron";
  const cauldronBody = document.createElement("div");
  cauldronBody.className = "cauldron-body";
  const burst = document.createElement("div");
  burst.className = "cauldron-burst";
  burst.setAttribute("aria-hidden", "true");
  for (let spark = 0; spark < 8; spark += 1) {
    burst.append(document.createElement("span"));
  }
  cauldron.append(cauldronBody, burst);

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.append(status, timer, lives);

  const menu = document.createElement("div");
  menu.className = "menu-row";
  menu.append(
    continueButton,
    start,
    helpButton,
    settingsButton,
    openBoard,
    pause,
  );

  const shelfPanel = document.createElement("section");
  shelfPanel.className = "panel";
  shelfPanel.append(shelfTitle, shelf);

  const bench = document.createElement("section");
  bench.className = "panel bench";
  const reactionNotice = document.createElement("p");
  reactionNotice.className = "reaction-notice";
  bench.append(bars, reactionNotice, cauldronTitle, cauldron);

  const workspace = document.createElement("div");
  workspace.className = "workspace";
  workspace.append(shelfPanel, bench);

  field.append(hud, menu, recipePanel, result, workspace);

  const pauseDialog = document.createElement("dialog");
  pauseDialog.className = "pause-dialog";
  const pauseCard = document.createElement("div");
  pauseCard.className = "pause-card";
  const pauseKicker = document.createElement("p");
  pauseKicker.className = "screen-kicker";
  pauseKicker.textContent = "The mixture holds";
  const pauseTitle = document.createElement("h2");
  pauseTitle.id = "pause-title";
  pauseTitle.className = "pause-heading";
  pauseTitle.textContent = "Game Paused";
  const resume = document.createElement("button");
  resume.type = "button";
  resume.className = "start-button";
  resume.textContent = "Resume";
  const exit = document.createElement("button");
  exit.type = "button";
  exit.className = "pause-exit";
  exit.textContent = "Exit to Menu";
  pauseCard.append(pauseKicker, pauseTitle, resume, exit);
  pauseDialog.append(pauseCard);
  pauseDialog.setAttribute("aria-labelledby", "pause-title");

  const gameOver = document.createElement("section");
  gameOver.className = "game-over";
  const embers = document.createElement("div");
  embers.className = "game-over-embers";
  embers.setAttribute("aria-hidden", "true");
  for (let ember = 0; ember < 10; ember += 1) {
    embers.append(document.createElement("span"));
  }
  const gameOverKicker = document.createElement("p");
  gameOverKicker.className = "game-over-kicker";
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
  const gameOverPlate = document.createElement("div");
  gameOverPlate.className = "game-over-plate";
  gameOverPlate.append(nameForm, gameOverActions);
  gameOver.append(
    embers,
    gameOverKicker,
    gameOverTitle,
    gameOverReason,
    gameOverScore,
    gameOverPlate,
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
    "Click an ingredient or drag it into the cauldron until Temperature, Density and Magic Power fit the recipe. Hover a card to see those three numbers. Brew allows a tolerance around each range.",
    "Stock is spent when an ingredient goes into the cauldron. A successful brew scores points and adds time, never above the start time. A failed brew costs a life. Pour Out empties the cauldron for 10 seconds, keeps the life, and does not return the ingredients. On Medium and Hard, some mixes start a reaction that changes the bars, the clock, or the cauldron. The same mix does not trigger twice until it breaks.",
    "The run ends when time runs out, lives reach 0, or the shelf and the cauldron are both empty. Pause stops the clock. An unfinished game can be continued after the page is reloaded.",
    "During a run, P pauses, B brews, O pours out, and 1–8 adds the ingredient in that shelf slot. These keys do nothing on the start screen, the pause screen, or the game over screen. Resume with the Resume button.",
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
    masthead,
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
    timer.setAttribute("aria-label", `Time ${timerValue.textContent}`);
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
    masthead.classList.toggle(
      "is-title-screen",
      !state.started && !showLeaderboard,
    );
    scoreValue.textContent = String(state.started ? state.score : 0);
    status.setAttribute("aria-label", `Score ${scoreValue.textContent}`);
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
    pour.disabled = !playing || count === 0;
    result.textContent = brewMessage(state);
    updateClock(state.timeLeft, playing);

    if (state.gameOverReason) {
      gameOverKicker.textContent = GAME_OVER_KICKER[state.gameOverReason];
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

    renderBars(
      bars,
      cauldronValues(state.cauldronIngredients, state.difficulty),
      recipe,
    );
    const activeNames = activeReactionNames(
      state.cauldronIngredients,
      state.difficulty,
    );
    const firedName = state.lastReactionId
      ? reactionName(state.lastReactionId)
      : null;
    const reactionLabel =
      activeNames.length > 0 ? activeNames.join(", ") : firedName;
    reactionNotice.textContent = reactionLabel
      ? `Reaction: ${reactionLabel}`
      : "";
    renderShelf(shelf, state, (id) => {
      state = addToCauldron(state, id);
      remember();
      paint();
    });
    renderCauldron(cauldronBody, state.cauldronIngredients);
    if (!canAddIngredient(state)) {
      cauldron.classList.remove("is-drop-target");
    }

    if (state.paused && !pauseDialog.open) {
      pauseDialog.showModal();
      resume.focus();
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

  bindCauldronDrop(
    cauldron,
    () => canAddIngredient(state),
    (id) => {
      const next = addToCauldron(state, id);
      if (next === state) {
        return;
      }

      suppressNextClick();
      state = next;
      remember();
      paint();
    },
  );

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

  const replayAnimation = (element: HTMLElement, className: string): void => {
    element.classList.remove(
      "is-brew-success",
      "is-brew-failure",
      "is-shaking",
    );
    void element.offsetWidth;
    element.classList.add(className);
  };

  cauldron.addEventListener("animationend", (event) => {
    if (event.target !== cauldron) {
      return;
    }

    cauldron.classList.remove("is-brew-success", "is-brew-failure");
  });

  field.addEventListener("animationend", (event) => {
    if (event.target !== field) {
      return;
    }

    field.classList.remove("is-shaking");
  });

  const runBrew = (): void => {
    const before = state;
    state = brewPotion(state);
    remember();
    paint();

    const brewed =
      before.cauldronIngredients.length > 0 &&
      state.cauldronIngredients.length === 0 &&
      state.lastBrew !== null;

    if (!brewed) {
      return;
    }

    if (state.lastBrew === "success") {
      field.classList.remove("is-shaking");
      replayAnimation(cauldron, "is-brew-success");
      return;
    }

    replayAnimation(cauldron, "is-brew-failure");
    replayAnimation(field, "is-shaking");
  };

  const runPour = (): void => {
    state = pourOut(state);
    remember();
    paint();
  };

  const runPause = (): void => {
    state = pauseGame(state);
    remember();
    paint();
  };

  brew.addEventListener("click", runBrew);
  pour.addEventListener("click", runPour);
  pause.addEventListener("click", runPause);

  const playGate = (): PlayGate => {
    if (!state.started || showLeaderboard) {
      return "menu";
    }

    if (state.gameOverReason) {
      return "game-over";
    }

    if (state.paused) {
      return "paused";
    }

    return "playing";
  };

  document.addEventListener("keydown", (event) => {
    const shortcut = shortcutFromEvent(event, playGate());
    if (!shortcut) {
      return;
    }

    event.preventDefault();

    if (shortcut.kind === "pause") {
      runPause();
      return;
    }

    if (shortcut.kind === "brew") {
      runBrew();
      return;
    }

    if (shortcut.kind === "pour") {
      runPour();
      return;
    }

    const ingredient = state.shelf[shortcut.index];
    if (!ingredient) {
      return;
    }

    state = addToCauldron(state, ingredient.id);
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
