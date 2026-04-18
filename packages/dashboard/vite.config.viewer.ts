import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "dist/viewer",
    emptyOutDir: true,
    rollupOptions: {
      input: "viewer.html",
    },
    // Keep the bundle tight — the viewer must stay under 200KB.
    minify: "esbuild",
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});
