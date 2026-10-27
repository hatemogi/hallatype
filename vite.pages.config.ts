import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./pages/', import.meta.url)),
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src/', import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist-pages/', import.meta.url)),
    emptyOutDir: true,
  },
  plugins: [vue()],
});
