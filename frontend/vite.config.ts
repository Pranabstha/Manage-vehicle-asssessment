import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "");

  return {
    plugins: [react()],
    server: {
      port: Number(env.FRONTEND_PORT ?? 5132),
      // Same /api proxy as nginx in Docker.
      proxy: {
        "/api": `http://localhost:${env.BACKEND_PORT ?? 8000}`,
      },
    },
  };
});
