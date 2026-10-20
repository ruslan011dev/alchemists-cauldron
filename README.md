# Alchemist's Cauldron

A browser game about brewing potions. The player adds ingredients from a shelf into a cauldron and watches three values: **Temperature**, **Density**, and **Magic Power**. The goal of a round is to bring all three into the target ranges of the current recipe, then brew before the timer or the lives run out.

Each ingredient has a limited stock. A brew spends the ingredients in the cauldron whether it succeeds or fails. The run ends when the time is over, the lives are gone, or the shelf and the cauldron are both empty.

## Task set

The work is split into a technical base and three game levels. Later levels keep everything from the earlier ones.

| Stage               | What it adds                                                                          |
| ------------------- | ------------------------------------------------------------------------------------- |
| Precondition 1      | Repository, tooling, folder structure, and quality checks                             |
| Level 1 — Basic     | One playable game with one fixed rule set                                             |
| Level 2 — Extended  | Difficulty selection, saving, and continue                                            |
| Level 3 — Full game | Drag and drop, tooltips, reactions, Pour Out, keyboard shortcuts, and visual feedback |

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

- TypeScript only. No frameworks, CSS frameworks, game engines, or other libraries.
- Game rules stay separate from the screen.
- The game is meant for the latest Google Chrome, on screens from 375 px to 1920 px wide.

## Current game

The shelf and cauldron from Level 1 are playable. Press **Start Game**. A medium recipe is chosen, and six ingredient cards appear, each with its own stock from 2 to 15. Click a card to add that ingredient to the cauldron. The cauldron keeps the click order and holds at most 4 ingredients. At 4, the shelf stops accepting clicks. A card with stock 0 stays in place, turns dim, and cannot be used.

Three bars show Temperature, Density and Magic Power. An empty cauldron is 0 / 0 / 0. Each added ingredient changes the sums. The pale band on a bar is the recipe target, the light line is 0, and the marker is the current value. The bar glows green when the value sits inside the target.

The full catalogue has 8 ingredients. This level uses the first 6.

## Run

```bash
npm install
npm run dev
```

`npm run build` checks the types and writes the production build to `dist/`. `npm run preview` serves that build.

`npm run lint` checks the code. `npm run format` formats it. A commit message must follow the [RS School git convention](https://rs.school/docs/git-convention). Before a push, lint and formatting must pass.
