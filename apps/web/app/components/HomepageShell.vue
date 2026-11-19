<script setup lang="ts">
import type { SiteFeature } from '#shared/site';

const props = defineProps<{ feature?: SiteFeature }>();
const homepage = useTemplateRef<HTMLElement>('homepage');
const { theme, selectTheme, tints } = useHomepageGlass(homepage);
const settingsOpen = ref(false);

watch(() => props.feature?.id, id => {
  if (id) settingsOpen.value = false;
});
</script>

<template>
  <div ref="homepage" class="home-page extension-home website-home" :data-theme="theme" data-dock-position="bottom" :style="tints">
    <div class="home-background" aria-hidden="true" />
    <SiteHeader :inert="Boolean(feature)" @settings="settingsOpen = true" />
    <main class="home-main" :inert="Boolean(feature)">
      <HomepageHero />
    </main>
    <div class="home-bottom-buffer" aria-hidden="true" />
    <FeatureModal :feature="feature">
      <slot />
      <template #navigation><SiteDock /></template>
    </FeatureModal>
    <SettingsWindow v-if="settingsOpen && !feature" :theme="theme" @theme="selectTheme" @close="settingsOpen = false" />
  </div>
</template>
