<script setup lang="ts">
import { findSiteFeature } from '#shared/site';

definePageMeta({
  validate: route => Boolean(findSiteFeature(route.path)),
});

const route = useRoute();
const feature = computed(() => findSiteFeature(route.path));
const tints = useHomepageGlassTints();
useSiteSeo(() => {
  const current = feature.value;
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Feature not found' });
  return { title: current.seoTitle, description: current.seoDescription, path: current.path };
});
</script>

<template>
  <div v-if="feature?.id === 'appearance'" class="feature-whiteboard">
    <fieldset class="glass-tint-settings">
      <legend>Glass tint</legend>
      <label for="glass-tint-light">
        Light mode
        <output for="glass-tint-light" aria-hidden="true">{{ Math.round(tints.light * 100) }}%</output>
      </label>
      <input
        id="glass-tint-light"
        v-model.number="tints.light"
        type="range"
        min="0"
        max="1.5"
        step="0.05"
        :aria-valuetext="`${Math.round(tints.light * 100)}%`"
      />
      <label for="glass-tint-dark">
        Dark mode
        <output for="glass-tint-dark" aria-hidden="true">{{ Math.round(tints.dark * 100) }}%</output>
      </label>
      <input
        id="glass-tint-dark"
        v-model.number="tints.dark"
        type="range"
        min="0"
        max="1.5"
        step="0.05"
        :aria-valuetext="`${Math.round(tints.dark * 100)}%`"
      />
    </fieldset>
  </div>
  <div v-else class="feature-whiteboard" />
</template>
