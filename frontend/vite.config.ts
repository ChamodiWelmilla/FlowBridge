import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/v1/documents': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/api/v1/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/api/v1/dead-letter': {
        target: 'http://localhost:8082',
        changeOrigin: true
      }
    }
  }
});
