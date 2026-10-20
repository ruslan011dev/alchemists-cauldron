import cauldronUrl from "../assets/cauldron.svg";

export function renderApp(root: HTMLElement): void {
  const icon = document.createElement("img");
  icon.src = cauldronUrl;
  icon.alt = "";
  icon.width = 64;
  icon.height = 64;

  const title = document.createElement("h1");
  title.textContent = "Alchemist's Cauldron";

  root.replaceChildren(icon, title);
}
