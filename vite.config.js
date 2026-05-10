import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Proxy /api to local backend. Start backend: cd backend && npm run dev
    proxy: {
      '/api': {
        target: 'https://myproject-backend-roan.vercel.app/',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: false,
    },
  },
})