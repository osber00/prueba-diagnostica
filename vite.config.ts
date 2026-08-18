import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src/client"),
      "@shared": path.resolve(import.meta.dirname, "src/shared"),
    },
  },
  build: {
    // El estudiante entra por móvil con conectividad limitada:
    // avisamos si alguna ruta crece más de lo aceptable.
    chunkSizeWarningLimit: 200,
    rollupOptions: {
      output: {
        // Recharts solo se descarga en el panel gestor, nunca en la prueba.
        manualChunks(id) {
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
        },
      },
    },
  },
});
