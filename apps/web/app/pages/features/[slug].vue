<script setup lang="ts">
import { findSiteFeature } from '#shared/site';

definePageMeta({
  validate: route => Boolean(findSiteFeature(route.path)),
});

const route = useRoute();
useSiteSeo(() => {
  const feature = findSiteFeature(route.path);
  if (!feature) throw createError({ statusCode: 404, statusMessage: 'Feature not found' });
  return { title: feature.seoTitle, description: feature.seoDescription, path: feature.path };
});
</script>

<template>
  <!-- Future semantic feature content goes here and will render on the server. -->
  <div class="feature-whiteboard" />
</template>
