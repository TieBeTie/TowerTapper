import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 80,
    open: true,
    host: 'localhost'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}); 