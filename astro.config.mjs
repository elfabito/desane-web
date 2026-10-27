// @ts-check
import { rename, rmdir } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Astro writes the English 404 to en/404/index.html, but Cloudflare answers a missing URL
// with the closest 404.html (see wrangler.jsonc), so it has to sit at en/404.html to cover /en/*
/** @type {import('astro').AstroIntegration} */
const englishNotFound = {
  name: 'english-404',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await rename(new URL('en/404/index.html', dir), new URL('en/404.html', dir));
      await rmdir(new URL('en/404/', dir));
    },
  },
};

export default defineConfig({
  site: 'https://desane.com.uy',
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    // The 404 pages answer missing URLs, they are not pages of their own
    sitemap({ filter: (page) => !/\/404\/?$/.test(new URL(page).pathname) }),
    englishNotFound,
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
