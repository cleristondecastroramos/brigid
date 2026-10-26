import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// Identificação da versão publicada, exibida no rodapé institucional
const commit = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || "local";
const dataBuild = new Date().toISOString().slice(0, 10);

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BRIGID_VERSAO__: JSON.stringify(`${dataBuild} · ${commit}`),
  },
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
