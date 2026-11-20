import { fileURLToPath } from 'node:url';
import { chromeWebStoreListingUrl } from './shared/site';

export default defineNuxtConfig({
  compatibilityDate: '2026-11-09',
  devtools: { enabled: false },
  ssr: true,
  css: ['~/assets/css/main.css'],
  // Reuse presentational UI without importing the extension's Chrome API entry point.
  alias: {
    '#extension-home': fileURLToPath(new URL('../extension/components/home', import.meta.url)),
    '#extension-assets': fileURLToPath(new URL('../extension/assets', import.meta.url)),
    '#extension-composables': fileURLToPath(new URL('../extension/composables', import.meta.url)),
  },
  runtimeConfig: {
    public: {
      siteUrl: '',
      chromeWebStoreUrl: chromeWebStoreListingUrl,
    },
  },
  app: {
    head: {
      title: 'bytab',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
});
