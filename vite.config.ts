import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { stylex } from 'vite-plugin-stylex-dev'

export default defineConfig({
  plugins: [
    react(),
    stylex(),
  ],
  // Required headers for SharedArrayBuffer
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
})
