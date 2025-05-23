import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "localhost",
    port: 5173,
  },
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
  },
});
