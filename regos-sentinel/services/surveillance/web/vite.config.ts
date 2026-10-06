import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` proxies the API; `npm run build` writes straight into the API's wwwroot so one container serves both.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:5080", "/health": "http://localhost:5080" } },
  build: { outDir: "../src/Surveillance.Api/wwwroot", emptyOutDir: true },
});
