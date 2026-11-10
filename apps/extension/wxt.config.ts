import { defineConfig } from 'wxt';

export default defineConfig({
  browser: 'chrome',
  modules: ['@wxt-dev/module-vue'],
  manifestVersion: 3,
  manifest: {
    name: 'bytab',
    description: 'A clean new tab for your bookmarks.',
    version: '0.1.0',
    permissions: ['bookmarks', 'storage', 'sessions'],
  },
});
