import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: fileURLToPath(new URL('./pages/', import.meta.url)),
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src/', import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL('./docs/', import.meta.url)),
    emptyOutDir: true,
  },
  plugins: [
    vue(),
    VitePWA({
      filename: 'service-worker.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'img/icons/*.png'],
      manifest: {
        name: '글숨 · 한 글자씩, 마음을 고르다.',
        short_name: '글숨',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f4f1e9',
        theme_color: '#f4f1e9',
        icons: [
          { src: 'img/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'img/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
