<script setup lang="ts">
import type { SiteFeature } from '#shared/site';
import { homepageInitialThemeScript } from '~/composables/useHomepageGlass';

const props = defineProps<{ feature?: SiteFeature }>();
const renderInitialThemeScript = import.meta.server || useNuxtApp().isHydrating;
const homepage = useTemplateRef<HTMLElement>('homepage');
const { effectiveTheme, themePreference, selectTheme, tints } = useHomepageGlass(homepage);
const settingsOpen = ref(false);

watch(() => props.feature?.id, id => {
  if (id) settingsOpen.value = false;
});
</script>

<template>
  <div ref="homepage" class="home-page extension-home website-home" :data-theme="effectiveTheme ?? 'system'" data-dock-position="bottom" :style="tints">
    <component :is="'script'" v-if="renderInitialThemeScript" :innerHTML="homepageInitialThemeScript" />
    <div class="home-background" aria-hidden="true" />
    <SiteHeader :inert="Boolean(feature)" @settings="settingsOpen = true" />
    <main class="home-main" :inert="Boolean(feature)">
      <HomepageHero :show-page-heading="!feature" :tooltip-blocked="settingsOpen || Boolean(feature)" />
    </main>
    <div class="home-bottom-buffer" aria-hidden="true" />
    <FeatureModal :feature="feature">
      <slot />
      <template #navigation><SiteDock /></template>
    </FeatureModal>
    <SettingsWindow v-if="settingsOpen && !feature" :theme="themePreference" @theme="selectTheme" @close="settingsOpen = false" />
  </div>
</template>
