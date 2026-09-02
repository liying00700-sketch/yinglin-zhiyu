import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 4178,
      proxy: {
        '/api/parenting/ai': {
          target: env.PARENTING_API_ORIGIN || 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
