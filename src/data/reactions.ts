import type { IIngredient } from "../data/ingredients";
import type { CauldronValues } from "../logic/calculate-cauldron";
import { calculateCauldron } from "../logic/calculate-cauldron";
import type { Difficulty } from "./difficulty";

export interface ReactionEffect {
  timePenalty: number;
  loseLife: boolean;
  clearCauldron: boolean;
}

export interface IReaction {
  id: string;
  name: string;
  difficulty: Exclude<Difficulty, "easy">;
  isActive: (ingredients: readonly IIngredient[]) => boolean;
  apply: (values: CauldronValues) => CauldronValues;
  effect: ReactionEffect;
}

const NONE: ReactionEffect = {
  timePenalty: 0,
  loseLife: false,
  clearCauldron: false,
};

function hasAll(
  ingredients: readonly IIngredient[],
  ...ids: readonly string[]
): boolean {
  return ids.every((id) => ingredients.some((item) => item.id === id));
}

function percent(value: number, factor: number): number {
  return Math.round(value * factor);
}

function pair(
  id: string,
  name: string,
  difficulty: Exclude<Difficulty, "easy">,
  left: string,
  right: string,
  apply: (values: CauldronValues) => CauldronValues,
  effect: ReactionEffect = NONE,
): IReaction {
  return {
    id,
    name,
    difficulty,
    isActive: (ingredients) => hasAll(ingredients, left, right),
    apply,
    effect,
  };
}

export const REACTIONS: readonly IReaction[] = [
  pair(
    "bubbling",
    "Bubbling",
    "medium",
    "fairy-dust",
    "caustic-acid",
    (values) => ({
      ...values,
      magicPower: percent(values.magicPower, 1.5),
    }),
    { timePenalty: 10, loseLife: false, clearCauldron: false },
  ),
  pair(
    "volatile-mix",
    "Volatile Mix",
    "hard",
    "phoenix-feather",
    "essence-of-the-void",
    (values) => values,
    { timePenalty: 0, loseLife: true, clearCauldron: true },
  ),
  pair(
    "solar-frost",
    "Solar Frost",
    "medium",
    "dragon-tears",
    "frost-lotus",
    (values) => ({
      ...values,
      temperature: 0,
      density: percent(values.density, 1.2),
    }),
  ),
  pair(
    "rooted-steam",
    "Rooted Steam",
    "hard",
    "mandrake-root",
    "toad-slime",
    (values) => ({
      ...values,
      density: percent(values.density, 1.25),
      magicPower: percent(values.magicPower, 0.9),
    }),
  ),
  pair(
    "ashen-bloom",
    "Ashen Bloom",
    "hard",
    "phoenix-feather",
    "fairy-dust",
    (values) => ({
      ...values,
      temperature: values.temperature + 10,
      magicPower: percent(values.magicPower, 1.25),
    }),
  ),
  {
    id: "annihilation",
    name: "Annihilation",
    difficulty: "medium",
    isActive: (ingredients) => {
      const hot = ingredients.some((item) => item.temperature > 15);
      const cold = ingredients.some((item) => item.temperature < -15);
      return hot && cold;
    },
    apply: (values) => ({
      ...values,
      temperature: 0,
      density: values.density * 2,
    }),
    effect: NONE,
  },
  {
    id: "pressure-spike",
    name: "Pressure Spike",
    difficulty: "medium",
    isActive: (ingredients) => calculateCauldron(ingredients).density >= 70,
    apply: (values) => ({
      ...values,
      density: 70,
      magicPower: percent(values.magicPower, 1.1),
    }),
    effect: NONE,
  },
  {
    id: "magma-flux",
    name: "Magma Flux",
    difficulty: "medium",
    isActive: (ingredients) => calculateCauldron(ingredients).temperature >= 60,
    apply: (values) => ({
      ...values,
      magicPower: percent(values.magicPower, 1.2),
      density: percent(values.density, 0.9),
    }),
    effect: NONE,
  },
  {
    id: "deep-freeze",
    name: "Deep Freeze",
    difficulty: "medium",
    isActive: (ingredients) =>
      calculateCauldron(ingredients).temperature <= -20,
    apply: (values) => ({
      ...values,
      density: percent(values.density, 1.15),
      magicPower: percent(values.magicPower, 0.85),
    }),
    effect: NONE,
  },
  {
    id: "arcane-saturation",
    name: "Arcane Saturation",
    difficulty: "medium",
    isActive: (ingredients) => calculateCauldron(ingredients).magicPower >= 80,
    apply: (values) => ({
      ...values,
      magicPower: 80,
      temperature: values.temperature + 5,
    }),
    effect: NONE,
  },
  {
    id: "steam-burst",
    name: "Steam Burst",
    difficulty: "medium",
    isActive: (ingredients) =>
      hasAll(ingredients, "dragon-tears", "caustic-acid") &&
      calculateCauldron(ingredients).temperature >= 35,
    apply: (values) => ({
      ...values,
      temperature: values.temperature + 10,
    }),
    effect: { timePenalty: 5, loseLife: false, clearCauldron: false },
  },
  {
    id: "black-ice",
    name: "Black Ice",
    difficulty: "medium",
    isActive: (ingredients) =>
      hasAll(ingredients, "frost-lotus", "essence-of-the-void") &&
      calculateCauldron(ingredients).density <= 0,
    apply: (values) => ({
      ...values,
      temperature: values.temperature - 10,
      magicPower: percent(values.magicPower, 1.2),
    }),
    effect: NONE,
  },
  pair(
    "heavy-spark",
    "Heavy Spark",
    "hard",
    "fairy-dust",
    "toad-slime",
    (values) => ({
      ...values,
      density: percent(values.density, 1.2),
      magicPower: percent(values.magicPower, 1.1),
    }),
    NONE,
  ),
  {
    id: "burning-root",
    name: "Burning Root",
    difficulty: "hard",
    isActive: (ingredients) =>
      hasAll(ingredients, "mandrake-root", "phoenix-feather") &&
      calculateCauldron(ingredients).temperature >= 40,
    apply: (values) => ({
      ...values,
      temperature: values.temperature + 15,
      density: percent(values.density, 0.9),
    }),
    effect: NONE,
  },
  {
    id: "void-resonance",
    name: "Void Resonance",
    difficulty: "medium",
    isActive: (ingredients) =>
      hasAll(ingredients, "essence-of-the-void", "dragon-tears") &&
      calculateCauldron(ingredients).magicPower >= 50,
    apply: (values) => ({
      ...values,
      magicPower: percent(values.magicPower, 1.3),
      temperature: values.temperature - 5,
    }),
    effect: NONE,
  },
];

const MEDIUM_REACTION_IDS = ["bubbling", "solar-frost"] as const;
const HARD_REACTION_IDS = ["bubbling", "volatile-mix", "solar-frost"] as const;

export function reactionsFor(difficulty: Difficulty): readonly IReaction[] {
  if (difficulty === "easy") {
    return [];
  }

  const ids = difficulty === "medium" ? MEDIUM_REACTION_IDS : HARD_REACTION_IDS;
  return ids.flatMap((id) => {
    const reaction = REACTIONS.find((item) => item.id === id);
    return reaction ? [reaction] : [];
  });
}

export function reactionName(id: string): string | null {
  return REACTIONS.find((reaction) => reaction.id === id)?.name ?? null;
}
