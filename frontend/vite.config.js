import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    headers: {
      // Required for @imgly/background-removal (SharedArrayBuffer / WASM)
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // @imgly ships heavy WASM assets — exclude from dependency pre-bundling
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },

  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          react:  ['react', 'react-dom'],
          motion: ['framer-motion'],
          lucide: ['lucide-react'],
        },
      },
    },
  },
});