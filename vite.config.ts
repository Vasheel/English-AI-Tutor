// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",          // ok (binds IPv6 + IPv4); you can also use '127.0.0.1'
    port: 8080,          // fine (just remember to visit http://localhost:8080)
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000", // ← prefer 127.0.0.1 to avoid IPv6 localhost quirks
        changeOrigin: true,
        secure: false,                   // harmless for http, avoids SSL checks if you ever use https locally
        // ws: true,                     // only if you later use websockets
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
