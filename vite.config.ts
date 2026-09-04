import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config.js';

// La SPA de gestión vive en src/client y buildea a dist/client (lo que sirve el
// assets binding del Worker, montada en /app/*). En dev, /api se proxea al
// wrangler dev (:8787). El SSR público del marketplace lo hace el Worker, no Vite.
export default defineConfig({
  root: 'src/client',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss(tailwindConfig), autoprefixer()],
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist/client', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
