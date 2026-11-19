<script setup lang="ts">
import { useClock } from '#extension-composables/useClock';
import HomeClock from '#extension-home/HomeClock.vue';
import HolidayInfo from '#extension-home/HolidayInfo.vue';
import ShortcutsPanel from '#extension-home/ShortcutsPanel.vue';
import { resolveChromeWebStoreUrl } from '#shared/site';

const { time, date, holiday } = useClock();
const storeUrl = resolveChromeWebStoreUrl(useRuntimeConfig().public.chromeWebStoreUrl);
</script>

<template>
  <HomeClock :time="time" :date="date" />
  <HolidayInfo :label="holiday" confirmed />
  <div class="homepage-install-row">
    <p class="homepage-tagline">Start your day. Start with bytab.</p>
    <a v-if="storeUrl" class="chrome-install" :href="storeUrl" target="_blank" rel="noopener noreferrer">
      Add to Chrome <span aria-hidden="true">↗</span>
    </a>
    <button v-else class="chrome-install" type="button" disabled aria-label="Chrome extension coming soon">Coming Soon</button>
  </div>
  <PromptPreview />
  <PreviewTooltip
    class="intro-hotspot intro-hotspot--shortcuts"
    button-id="intro-shortcuts"
    button-class="intro-hotspot-hit"
    label="About Frequent Shortcuts in the Chrome extension"
    description="Save the sites you visit often and open them from your new tab."
  >
    <template #preview>
      <div class="intro-hotspot-preview" inert>
        <ShortcutsPanel />
      </div>
    </template>
  </PreviewTooltip>
</template>
