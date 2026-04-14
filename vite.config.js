import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild', // esbuild is faster, but terser can be slightly smaller. Using esbuild for speed.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-icons'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
