import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Force restart to load Firebase .env variables
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  }
})
