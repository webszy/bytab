<script setup lang="ts">
import HomeIcon from '#extension-home/HomeIcon.vue';
import type { HomeIconName } from '#extension-home/home-icons';
import type { FeatureGlyph } from '#shared/feature-content';

const props = defineProps<{ name: FeatureGlyph }>();
const homeNames = ['bookmark', 'search', 'settings', 'sparkle', 'globe', 'folder'] as const satisfies readonly HomeIconName[];
const homeName = computed(() => homeNames.find(name => name === props.name));
</script>

<template>
  <HomeIcon v-if="homeName" :name="homeName" />
  <SiteIcon v-else :name="name === 'dock' ? 'dock' : 'shield'" />
</template>
