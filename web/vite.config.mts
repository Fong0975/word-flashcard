import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// docker/web/Dockerfile runs `serve -s build`, so the output directory name
// must stay `build` (Vite's default is `dist`).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  server: {
    port: 3000,
  },
});
