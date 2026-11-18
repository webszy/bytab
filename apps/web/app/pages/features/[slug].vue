<script setup lang="ts">
import { findFeatureContent } from '#shared/feature-content';
import { findSiteFeature } from '#shared/site';

definePageMeta({
  validate: route => Boolean(findSiteFeature(route.path)),
});

const route = useRoute();
const feature = computed(() => findSiteFeature(route.path));
const content = computed(() => feature.value ? findFeatureContent(feature.value.id) : undefined);
useSiteSeo(() => {
  const current = feature.value;
  if (!current || !findFeatureContent(current.id)) {
    throw createError({ statusCode: 404, statusMessage: 'Feature not found' });
  }
  return { title: current.seoTitle, description: current.seoDescription, path: current.path };
});
</script>

<template>
  <FeatureSheet v-if="feature && content" :feature="feature" :content="content" />
</template>
