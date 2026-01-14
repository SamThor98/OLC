import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/OLC/',
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5174, // Changed to 5174 since 5173 is in use
    strictPort: false, // Try next available port if 5174 is taken
    open: true, // Automatically open browser
  },
})
