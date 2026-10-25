import { defineConfig } from "vite";

export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/alchemists-cauldron/" : "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));
