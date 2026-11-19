import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Reads the repo-root .env, the same file docker-compose and the backend use.
  const env = loadEnv(mode, '..', '')

  return {
    plugins: [react()],
    server: {
      // Mirrors the nginx /api proxy in Docker, so the app always calls relative /api URLs.
      proxy: {
        '/api': `http://localhost:${env.BACKEND_PORT ?? 8000}`,
      },
    },
  }
})
