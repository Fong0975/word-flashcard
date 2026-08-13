import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// docker/web/Dockerfile runs `serve -s build`, so the output directory name
// must stay `build` (Vite's default is `dist`).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Reuse the existing public/manifest.json instead of generating one.
      manifest: false,
      includeAssets: [
        'favicon.ico',
        'logo192.png',
        'logo512.png',
        'robots.txt',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Serve the cached app shell for any SPA route while offline; API
        // requests go to a different origin/port and are never intercepted.
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    outDir: 'build',
  },
  server: {
    port: 3000,
  },
});
