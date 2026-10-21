import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'img/icons/*.png', 'img/icons/*.svg'],
      manifest: {
        name: 'hallatype',
        short_name: 'hallatype',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#4DBA87',
        icons: [
          { src: '/img/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/img/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    globals: true,
  },
});
