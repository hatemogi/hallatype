import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: fileURLToPath(new URL('./pages/', import.meta.url)),
  base: '/',
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
        name: '한글 타자 연습',
        short_name: 'hallatype',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4DBA87',
        icons: [
          { src: '/img/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/img/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
