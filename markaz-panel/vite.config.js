// Vite sozlamasi.
//
// dev rejimida panel 5173-portda ishlaydi, API so'rovlari esa Node
// serveriga (9090) proksilanadi — shunda cookie bitta manbadan ketadi
// va CORS bilan ovora bo'lmaymiz.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

const API = process.env.MARKAZ_API || 'http://127.0.0.1:9090';

export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/yuklab': { target: API, changeOrigin: true },
      '/salomat': { target: API, changeOrigin: true },
    },
  },
  build: {
    // Natija Node serveri beradigan papkaga tushadi
    outDir: 'dist',
    chunkSizeWarningLimit: 900,
  },
});
