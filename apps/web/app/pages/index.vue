<script setup lang="ts">
import { homepageSeo, resolveChromeWebStoreUrl } from '#shared/site';

const canonical = useSiteSeo({ ...homepageSeo, path: '/' });
const storeUrl = resolveChromeWebStoreUrl(useRuntimeConfig().public.chromeWebStoreUrl);
useHead(() => ({
  script: [{
    key: 'bytab-structured-data',
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'bytab', url: canonical.value },
        {
          '@type': 'SoftwareApplication',
          name: 'bytab',
          url: canonical.value,
          applicationCategory: 'BrowserApplication',
          softwareVersion: '0.0.1',
          operatingSystem: 'Google Chrome',
          description: 'A liquid glass new tab for Chrome bookmarks, shortcuts, and quick AI and search access.',
          ...(storeUrl ? { downloadUrl: storeUrl } : {}),
          offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
        },
      ],
    }),
  }],
}));
</script>

<template>
  <!-- The persistent default layout supplies the homepage. -->
  <div />
</template>
