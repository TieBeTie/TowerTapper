import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
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