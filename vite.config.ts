import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA нь kiosk-д offline ажиллах үндэс: интернет тасарсан үед 03:00-ийн reload
// хийгдсэн ч апп, фонт cache-ээс ачаалагдана.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Амжилт Кибер сургуулийн ранк',
        short_name: 'Rank',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#0F3460',
        theme_color: '#0F3460',
        icons: [{ src: 'logo-real.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
