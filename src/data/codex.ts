import type { Difficulty } from "./difficulty";

export interface CodexEntry {
  id: string;
  name: string;
  difficulty: Exclude<Difficulty, "easy">;
  summary: string;
}

export const CODEX_ENTRIES: readonly CodexEntry[] = [
  {
    id: "bubbling",
    name: "Bubbling",
    difficulty: "medium",
    summary:
      "Fairy Dust and Caustic Acid. Magic Power rises by half, and the clock loses 10 seconds.",
  },
  {
    id: "solar-frost",
    name: "Solar Frost",
    difficulty: "medium",
    summary:
      "Dragon Tears and Frost Lotus. Temperature falls to 0, and Density rises by a fifth.",
  },
  {
    id: "volatile-mix",
    name: "Volatile Mix",
    difficulty: "hard",
    summary:
      "Phoenix Feather and Essence of the Void. The cauldron empties and you lose a life.",
  },
];
