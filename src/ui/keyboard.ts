export type PlayGate = "playing" | "menu" | "paused" | "game-over";

export type Shortcut =
  | { readonly kind: "pause" }
  | { readonly kind: "brew" }
  | { readonly kind: "pour" }
  | { readonly kind: "add"; readonly index: number };

const SHORTCUTS = new Map<string, Shortcut>([
  ["KeyP", { kind: "pause" }],
  ["KeyB", { kind: "brew" }],
  ["KeyO", { kind: "pour" }],
  ["Digit1", { kind: "add", index: 0 }],
  ["Digit2", { kind: "add", index: 1 }],
  ["Digit3", { kind: "add", index: 2 }],
  ["Digit4", { kind: "add", index: 3 }],
  ["Digit5", { kind: "add", index: 4 }],
  ["Digit6", { kind: "add", index: 5 }],
  ["Digit7", { kind: "add", index: 6 }],
  ["Digit8", { kind: "add", index: 7 }],
  ["Numpad1", { kind: "add", index: 0 }],
  ["Numpad2", { kind: "add", index: 1 }],
  ["Numpad3", { kind: "add", index: 2 }],
  ["Numpad4", { kind: "add", index: 3 }],
  ["Numpad5", { kind: "add", index: 4 }],
  ["Numpad6", { kind: "add", index: 5 }],
  ["Numpad7", { kind: "add", index: 6 }],
  ["Numpad8", { kind: "add", index: 7 }],
]);

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function shortcutFromEvent(
  event: KeyboardEvent,
  gate: PlayGate,
): Shortcut | null {
  if (gate !== "playing") {
    return null;
  }

  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
    return null;
  }

  if (isTyping(event.target)) {
    return null;
  }

  return SHORTCUTS.get(event.code) ?? null;
}
