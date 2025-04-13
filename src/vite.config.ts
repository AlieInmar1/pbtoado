import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Align with tsconfig.json paths
      '@': path.resolve(__dirname, './'), // Points to src_rebuild root
      '@components': path.resolve(__dirname, './components'),
      '@features': path.resolve(__dirname, './features'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@lib': path.resolve(__dirname, './lib'), // Added alias for lib
      '@utils': path.resolve(__dirname, './utils'),
      '@services': path.resolve(__dirname, './services'),
      '@types': path.resolve(__dirname, './types'),
      '@constants': path.resolve(__dirname, './constants'),
      '@assets': path.resolve(__dirname, './assets'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Proxy API requests to Supabase (if needed)
      // '/api': {
      //   target: 'https://your-supabase-project.supabase.co',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, ''),
      // },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  // Optimize dependency prebundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'tailwind-merge',
      'sonner',
    ],
  },
});
