export const INGREDIENT_DRAG_FORMAT = "text/plain";

const DRAG_MARKER = "dragged";
const CLICK_SUPPRESS_MS = 120;

let ignoreClicksUntil = 0;
let ingredientDragActive = false;

export function setIngredientDrag(transfer: DataTransfer, id: string): void {
  transfer.effectAllowed = "copy";
  transfer.setData(INGREDIENT_DRAG_FORMAT, id);
}

export function ingredientIdFromDrop(transfer: DataTransfer): string {
  return transfer.getData(INGREDIENT_DRAG_FORMAT);
}

export function armIngredientDrag(button: HTMLButtonElement, id: string): void {
  button.addEventListener("dragstart", (event) => {
    const transfer = event.dataTransfer;
    if (!transfer) {
      event.preventDefault();
      return;
    }

    ingredientDragActive = true;
    button.dataset[DRAG_MARKER] = "true";
    setIngredientDrag(transfer, id);
  });

  button.addEventListener("dragend", () => {
    ingredientDragActive = false;
    queueMicrotask(() => {
      delete button.dataset[DRAG_MARKER];
    });
  });
}

export function suppressNextClick(): void {
  ignoreClicksUntil = performance.now() + CLICK_SUPPRESS_MS;
}

export function shouldIgnoreDragClick(button: HTMLButtonElement): boolean {
  if (!button.isConnected || performance.now() < ignoreClicksUntil) {
    return true;
  }

  if (button.dataset[DRAG_MARKER] !== "true") {
    return false;
  }

  delete button.dataset[DRAG_MARKER];
  return true;
}

export function bindCauldronDrop(
  cauldron: HTMLElement,
  canDrop: () => boolean,
  onDrop: (id: string) => void,
): void {
  const clearHighlight = (): void => {
    cauldron.classList.remove("is-drop-target");
  };

  cauldron.addEventListener("dragover", (event) => {
    if (!ingredientDragActive || !canDrop()) {
      clearHighlight();
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    cauldron.classList.add("is-drop-target");
  });

  cauldron.addEventListener("dragleave", (event) => {
    const next = event.relatedTarget;
    if (next instanceof Node && cauldron.contains(next)) {
      return;
    }

    clearHighlight();
  });

  cauldron.addEventListener("drop", (event) => {
    event.preventDefault();
    ingredientDragActive = false;
    clearHighlight();

    const transfer = event.dataTransfer;
    if (!transfer || !canDrop()) {
      return;
    }

    const id = ingredientIdFromDrop(transfer);
    if (id === "") {
      return;
    }

    onDrop(id);
  });

  document.addEventListener("dragend", () => {
    ingredientDragActive = false;
    clearHighlight();
  });
}
