import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { marketTrendPlugins } from "./client/src/lib/vitePlugins";

export default defineConfig({
  plugins: [
    react(),
    ...marketTrendPlugins(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
