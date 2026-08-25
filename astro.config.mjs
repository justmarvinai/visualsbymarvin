// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // ✏️ Change this to your real domain before going live (used for SEO / og tags)
  site: 'https://visualsbymarvin.com',
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep the CV a real downloadable file. Vite inlines assets under
      // ~4kB as data: URIs, which breaks `download` in some browsers —
      // opt PDFs out so behaviour never depends on file size.
      assetsInlineLimit: (file) => (file.endsWith('.pdf') ? false : undefined),
    },
  },
});
