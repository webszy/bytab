<script setup lang="ts">
import type { IntroId } from '#shared/intros';
import { findSiteIntro } from '#shared/intros';
import type { SiteFeature } from '#shared/site';

const props = defineProps<{ feature?: SiteFeature }>();
const homepage = useTemplateRef<HTMLElement>('homepage');
const { theme, tints } = useHomepageGlass(homepage);
const activeWindow = ref<IntroId | 'settings' | null>(null);
const intro = computed(() => findSiteIntro(activeWindow.value));
const settingsOpen = computed(() => !props.feature && activeWindow.value === 'settings');
const backgroundLocked = computed(() => Boolean(props.feature || activeWindow.value));

watch(() => props.feature?.id, id => {
  if (id) activeWindow.value = null;
});

function openWindow(id: IntroId | 'settings') {
  if (props.feature) return;
  activeWindow.value = id;
}
</script>

<template>
  <div ref="homepage" class="home-page extension-home website-home" :data-theme="theme" data-dock-position="bottom" :style="tints">
    <div class="home-background" aria-hidden="true" />
    <SiteHeader :inert="backgroundLocked" @settings="openWindow('settings')" />
    <main class="home-main" :inert="backgroundLocked">
      <HomepageHero @open-intro="openWindow" />
    </main>
    <div class="home-bottom-buffer" aria-hidden="true" />
    <FeatureModal :feature="feature">
      <slot />
      <template #intro>
        <FeatureIntroWindow v-if="!feature" :intro="intro" restore-focus @close="activeWindow = null" />
      </template>
      <template #navigation><SiteDock :inert="settingsOpen" /></template>
    </FeatureModal>
    <SettingsWindow :open="settingsOpen" @close="activeWindow = null" />
  </div>
</template>
