import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` is set so the built assets resolve correctly when the app is served
// from a GitHub Pages project subpath (e.g. https://user.github.io/blanje/).
// Override at build time with `BASE_PATH` if the repo name differs.
const base = process.env.BASE_PATH ?? "/blanje/";

export default defineConfig({
  base,
  plugins: [react()],
});
