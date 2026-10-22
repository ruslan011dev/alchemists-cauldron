import "./styles/style.css";
import { renderApp } from "./ui/app";

const root = document.querySelector<HTMLDivElement>("#app");

if (root) {
  renderApp(root);
}
