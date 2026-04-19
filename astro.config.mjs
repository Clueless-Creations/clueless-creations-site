import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://clueless-creations.com',
  integrations: [sitemap()],
  build: {
    format: 'file',
  },
  compressHTML: true,
});
