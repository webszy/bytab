<script setup lang="ts">
import { findSiteFeature, siteFeatures } from '#shared/site';

const route = useRoute();
const activeFeature = computed(() => findSiteFeature(route.path));
const bookmarks = siteFeatures.find(feature => feature.id === 'bookmarks')!;
const search = siteFeatures.find(feature => feature.id === 'search')!;
const categories = siteFeatures.filter(feature => feature.id !== 'bookmarks' && feature.id !== 'search');
const colors = ['design', 'work', 'reading'];
</script>

<template>
  <nav class="bookmark-dock site-dock" data-position="bottom" aria-label="Explore bytab features">
    <div class="dock-surface" aria-hidden="true" />
    <div class="dock-content">
      <div class="dock-root-group">
        <NuxtLink
          id="dock-bookmarks"
          :to="bookmarks.path"
          class="dock-root dock-item"
          :aria-current="activeFeature?.id === bookmarks.id ? 'page' : undefined"
          aria-label="All Bookmarks"
        >
          <span class="dock-root-icon"><SiteIcon :name="bookmarks.icon" /></span>
          <span class="dock-root-copy">
            <span class="dock-root-title">All Bookmarks</span>
            <span class="dock-root-subtitle">{{ bookmarks.title }}</span>
          </span>
        </NuxtLink>
        <span class="dock-divider" aria-hidden="true" />
      </div>
      <div class="dock-navigation">
        <NuxtLink
          v-for="(feature, index) in categories"
          :id="`dock-${feature.id}`"
          :key="feature.id"
          :to="feature.path"
          class="dock-folder dock-item"
          :class="`dock-folder--${colors[index % colors.length]}`"
          :aria-current="activeFeature?.id === feature.id ? 'page' : undefined"
        >
          <span class="dock-folder-icon"><SiteIcon :name="feature.icon" /></span>
          <span class="dock-folder-label">{{ feature.label }}</span>
        </NuxtLink>
      </div>
      <div class="dock-tools">
        <NuxtLink
          id="dock-search"
          :to="search.path"
          class="dock-filter dock-item"
          :aria-current="activeFeature?.id === search.id ? 'page' : undefined"
          :aria-label="search.label"
        >
          <SiteIcon :name="search.icon" />
          <span>{{ search.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
