import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    // Chunks menores = carregamento mais rápido
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Separar vendors em chunks independentes (cache eficiente)
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-date': ['date-fns'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Minificação com esbuild (built-in, sem dependência extra)
    minify: 'esbuild',
    // Source maps desligados em produção (menor tamanho)
    sourcemap: false,
  },
})
