import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Isolated Vite configuration for Benzin React Admin Dashboard
// Target output: public/admin_react/ (strictly isolated from existing legacy assets)
export default defineConfig({
  root: path.resolve(__dirname),
  base: '/admin_react/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@backend': path.resolve(__dirname, '..'),
    },
  },
  server: {
    port: 3001,
    strictPort: false,
    cors: true,
  },
  build: {
    outDir: path.resolve(__dirname, '../../public/admin_react'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
