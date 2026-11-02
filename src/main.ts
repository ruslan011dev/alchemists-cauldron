import "./styles/style.css";
import "./styles/progress.css";
import "./styles/themes.css";
import "./styles/audio.css";
import { renderApp } from "./ui/app";

const root = document.querySelector<HTMLDivElement>("#app");

if (root) {
  renderApp(root);
}
