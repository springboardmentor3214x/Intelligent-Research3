import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/profile': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/publications': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/patents': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});