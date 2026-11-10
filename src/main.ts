import "./styles/style.css";
import "./styles/progress.css";
import "./styles/themes.css";
import "./styles/audio.css";
import "./styles/install.css";
import { renderApp } from "./ui/app";
import { registerServiceWorker } from "./ui/install";

const root = document.querySelector<HTMLDivElement>("#app");

if (root) {
  registerServiceWorker();
  renderApp(root);
}
