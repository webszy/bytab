import { defineConfig } from 'wxt';

export default defineConfig({
  browser: 'chrome',
  outDir: 'dist',
  modules: ['@wxt-dev/module-vue'],
  manifestVersion: 3,
  manifest: {
    name: 'bytab',
    description: 'A clean new tab for your bookmarks.',
    version: '0.0.1',
    action: {
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
      },
    },
    permissions: ['bookmarks', 'storage', 'sessions', 'scripting'],
    optional_host_permissions: ['https://gemini.google.com/*'],
  },
});
