import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/alchemists-cauldron/" : "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
