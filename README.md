# Alchemist's Cauldron

A browser game about brewing potions. The player adds ingredients from a shelf into a cauldron and watches three values: **Temperature**, **Density**, and **Magic Power**. The goal of a round is to bring all three into the target ranges of the current recipe, then brew before the timer or the lives run out.

Play the game: https://ruslan011dev.github.io/alchemists-cauldron/

Each ingredient has a limited stock. A brew spends the ingredients in the cauldron whether it succeeds or fails. The run ends when the time is over, the lives are gone, or the shelf and the cauldron are both empty.

## What is implemented

Levels 1, 2 and 3 are implemented.

- **Level 1.** Shelf and cauldron, three parameter bars, random recipes, Brew, timer, lives, pause, game over, and a Top-10 leaderboard.
- **Level 2.** Easy, Medium and Hard in Settings. An unfinished game is saved in the browser and can be continued.
- **Level 3.** Drag and drop, hover tooltips, chemical reactions, Pour Out, brew animations, and keyboard shortcuts.

## Project structure

Game rules stay out of the screen code. Each area has its own folder:

```text
src/
  data/      ingredient, recipe and difficulty data
  logic/     pure game rules
  state/     current game state
  storage/   saving and the leaderboard
  ui/        screen rendering
  styles/    CSS
  assets/    icons and images
```

## Technical base

- TypeScript only.

## Run

Play the game: https://ruslan011dev.github.io/alchemists-cauldron/

```bash
npm install
npm run dev
```

`npm run dev` opens the game at `http://localhost:5173/`.

`npm run build` checks the types and writes the production build to `dist/`. `npm run preview` serves that build at `http://localhost:4173/alchemists-cauldron/`.

`npm run lint` checks the code. `npm run format` formats it. A commit message must follow the [RS School git convention](https://rs.school/docs/git-convention). Before a push, lint and formatting must pass.
