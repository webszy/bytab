<script setup lang="ts">
import { findSiteFeature, siteFeatures } from '#shared/site';

const route = useRoute();
const activeFeature = computed(() => findSiteFeature(route.path));
</script>

<template>
  <nav class="bookmark-dock site-dock" aria-label="Explore bytab features">
    <div class="dock-surface" aria-hidden="true" />
    <div class="dock-content site-dock-content">
      <NuxtLink
        v-for="feature in siteFeatures"
        :id="`dock-${feature.id}`"
        :key="feature.id"
        :to="feature.path"
        class="dock-item site-dock-item"
        :class="[{ 'is-active': activeFeature?.id === feature.id, 'site-dock-root': feature.id === 'bookmarks' }, `site-dock-item--${feature.id}`]"
        :aria-current="activeFeature?.id === feature.id ? 'page' : undefined"
      >
        <span class="site-dock-icon"><SiteIcon :name="feature.icon" /></span>
        <span class="site-dock-copy">
          <span class="site-dock-label">{{ feature.label }}</span>
          <span v-if="feature.id === 'bookmarks'" class="site-dock-subtitle">Native Chrome Bookmarks</span>
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>
