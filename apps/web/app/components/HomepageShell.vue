<script setup lang="ts">
import type { SiteFeature } from '#shared/site';

defineProps<{ feature?: SiteFeature }>();
</script>

<template>
  <div class="home-page website-home">
    <div class="home-background" aria-hidden="true" />
    <SiteHeader :inert="Boolean(feature)" />
    <main class="home-main" :inert="Boolean(feature)">
      <HomepageHero />
    </main>
    <div class="home-bottom-buffer" aria-hidden="true" />
    <FeatureModal :feature="feature">
      <slot />
      <template #navigation><SiteDock /></template>
    </FeatureModal>
  </div>
</template>
