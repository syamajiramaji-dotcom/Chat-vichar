import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("firebase")) return "vendor-firebase";
          if (id.includes("framer-motion")) return "vendor-framer";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (
            id.includes("socket.io-client") ||
            id.includes("engine.io-client") ||
            id.includes("engine.io-parser") ||
            id.includes("socket.io-parser")
          )
            return "vendor-socket";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("recharts") || id.includes("/d3-")) return "vendor-charts";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("react-dom")) return "vendor-react";
          return "vendor";
        },
      },
    },
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
