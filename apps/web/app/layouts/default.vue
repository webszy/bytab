<script setup lang="ts">
import { findSiteFeature } from '#shared/site';

const route = useRoute();
const feature = computed(() => findSiteFeature(route.path));
</script>

<template>
  <HomepageShell :feature="feature">
    <slot />
  </HomepageShell>
</template>
