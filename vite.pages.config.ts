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
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'img/icons/*.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'] },
      manifest: {
        id: './',
        name: '글숨',
        short_name: '글숨',
        description: '좋은 문장을 천천히 따라 쓰며 잠시 나에게 집중하는 시간.',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f4f1e9',
        theme_color: '#f4f1e9',
        icons: [
          { src: 'img/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'img/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'img/icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
