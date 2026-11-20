<script setup lang="ts">
import { useClock } from '#extension-composables/useClock';
import HomeClock from '#extension-home/HomeClock.vue';
import HolidayInfo from '#extension-home/HolidayInfo.vue';
import ShortcutsPanel from '#extension-home/ShortcutsPanel.vue';
import { resolveChromeWebStoreUrl } from '#shared/site';

const props = defineProps<{ showPageHeading: boolean; tooltipBlocked: boolean }>();
const { time, date, holiday } = useClock();
const storeUrl = resolveChromeWebStoreUrl(useRuntimeConfig().public.chromeWebStoreUrl);
type Tooltip = 'prompt' | 'shortcuts';
const triggerIds: Record<Tooltip, string> = { prompt: 'intro-prompt', shortcuts: 'intro-shortcuts' };
const activeTooltip = ref<Tooltip | null>(null);
// Only the last opened tooltip may finish its exit animation.
const lastOpenedTooltip = ref<Tooltip | null>(null);

function toggleTooltip(tooltip: Tooltip) {
  if (props.tooltipBlocked) return;
  if (activeTooltip.value === tooltip) {
    activeTooltip.value = null;
  } else {
    lastOpenedTooltip.value = tooltip;
    activeTooltip.value = tooltip;
  }
}

function dismissOnOutsideClick(event: MouseEvent) {
  const tooltip = activeTooltip.value;
  if (!tooltip) return;
  const panelId = document.getElementById(triggerIds[tooltip])?.getAttribute('aria-controls');
  const inside = event.composedPath().some(node => node instanceof HTMLElement
    && (node.id === panelId || node.id === triggerIds.prompt || node.id === triggerIds.shortcuts));
  // Both triggers handle their clicks themselves, so switching never passes through a closed state.
  if (!inside) activeTooltip.value = null;
}

function dismissOnEscape(event: KeyboardEvent) {
  const tooltip = activeTooltip.value;
  if (!tooltip || event.defaultPrevented || event.key !== 'Escape') return;
  event.preventDefault();
  activeTooltip.value = null;
  document.getElementById(triggerIds[tooltip])?.focus({ preventScroll: true });
}

const route = useRoute();
watch([() => route.fullPath, () => props.tooltipBlocked], () => {
  activeTooltip.value = null;
  lastOpenedTooltip.value = null;
});
watch(() => activeTooltip.value !== null, (open, _, onCleanup) => {
  if (!open) return;
  document.addEventListener('click', dismissOnOutsideClick, true);
  document.addEventListener('keydown', dismissOnEscape);
  onCleanup(() => {
    document.removeEventListener('click', dismissOnOutsideClick, true);
    document.removeEventListener('keydown', dismissOnEscape);
  });
}, { flush: 'sync' });
</script>

<template>
  <HomeClock :time="time" :date="date" />
  <HolidayInfo :label="holiday" confirmed />
  <div class="homepage-intro">
    <component :is="showPageHeading ? 'h1' : 'p'" class="homepage-tagline">Chrome for browsing. bytab for bookmarks.</component>
    <p class="homepage-summary">
      A liquid glass new tab for the Chrome bookmarks you already have. Browse saved pages, search locally, organize your favorite shortcuts, and jump into your preferred AI or search tool.
    </p>
    <div class="homepage-install-row">
      <a v-if="storeUrl" class="chrome-install" :href="storeUrl" target="_blank" rel="noopener noreferrer">
        Add to Chrome — Free <span aria-hidden="true">↗</span>
      </a>
      <p class="homepage-install-note">Local-first · No bookmark uploads · No account needed</p>
    </div>
  </div>
  <PromptPreview
    :button-id="triggerIds.prompt"
    :open="activeTooltip === 'prompt'"
    :suppress="tooltipBlocked || lastOpenedTooltip !== 'prompt'"
    @toggle="toggleTooltip('prompt')"
  />
  <PreviewTooltip
    class="intro-hotspot intro-hotspot--shortcuts"
    :button-id="triggerIds.shortcuts"
    button-class="intro-hotspot-hit"
    prefer-below
    :open="activeTooltip === 'shortcuts'"
    :suppress="tooltipBlocked || lastOpenedTooltip !== 'shortcuts'"
    label="About Frequent Shortcuts in the Chrome extension"
    description="Save the sites you visit often and open them from your new tab."
    @toggle="toggleTooltip('shortcuts')"
  >
    <template #preview>
      <div class="intro-hotspot-preview">
        <ShortcutsPanel />
      </div>
    </template>
  </PreviewTooltip>
</template>
