import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 20103,
    host: "0.0.0.0",
    proxy: {
      // 本地开发同样统一走 /api，由 Vite 反代到本地后端
      "/api": {
        target: process.env.VITE_API_TARGET ?? "http://127.0.0.1:21103",
        changeOrigin: true
      }
    }
  }
});
