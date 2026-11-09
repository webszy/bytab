<script setup lang="ts">
import { siteFeatures } from '#shared/site';

const privacy = siteFeatures.find(feature => feature.id === 'privacy')!;
useSiteSeo({ title: privacy.seoTitle, description: privacy.seoDescription, path: privacy.path });
</script>

<template>
  <div class="feature-whiteboard" />
</template>
