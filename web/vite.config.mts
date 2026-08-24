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
    rollupOptions: {
      output: {
        // Keep rarely-changing vendor code in its own chunks so it stays
        // under the 500 kB warning threshold and caches independently of
        // app code between deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/react-router/') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }
          // `react-markdown` pulls in the whole unified/remark/rehype
          // ecosystem as transitive deps; they all follow these package
          // naming prefixes, so match broadly rather than listing every
          // individual dependency.
          if (
            /[\\/](react-markdown|remark|rehype|mdast|hast|micromark|unist|vfile|unified)[^\\/]*[\\/]/.test(
              id,
            )
          ) {
            return 'vendor-markdown';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});
