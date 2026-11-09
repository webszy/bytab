<script setup lang="ts">
import type { SiteFeature } from '#shared/site';

const props = defineProps<{ feature?: SiteFeature }>();
const layer = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
let previousFocus: HTMLElement | null = null;

function close() {
  // Replace avoids creating a Back -> reopen -> close history loop. Direct visits
  // are safe too: closing always stays on this website.
  return navigateTo('/', { replace: true });
}

function onKeydown(event: KeyboardEvent) {
  if (!props.feature) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    void close();
    return;
  }
  if (event.key !== 'Tab') return;

  const elements = [...(layer.value?.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
  ) ?? [])].filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
  const first = elements[0];
  const last = elements.at(-1);
  if (event.shiftKey && (document.activeElement === first || !layer.value?.contains(document.activeElement))) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !layer.value?.contains(document.activeElement))) {
    event.preventDefault();
    first?.focus();
  }
}

onMounted(() => {
  watch(() => props.feature?.id, async (id, previousId) => {
    if (id && !previousId) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await nextTick();
      closeButton.value?.focus({ preventScroll: true });
    } else if (!id && previousId) {
      await nextTick();
      const target = previousFocus?.isConnected && previousFocus !== document.body
        ? previousFocus
        : document.getElementById(`dock-${previousId}`);
      target?.focus({ preventScroll: true });
      previousFocus = null;
    }
  }, { immediate: true });
});
</script>

<template>
  <!-- Include the persistent Dock in the dialog's keyboard and accessibility
       scope so visitors can switch features while the window stays open. -->
  <section
    ref="layer"
    class="feature-layer"
    :role="feature ? 'dialog' : undefined"
    :aria-modal="feature ? true : undefined"
    :aria-labelledby="feature ? 'feature-window-title' : undefined"
    :aria-describedby="feature ? 'feature-window-summary' : undefined"
    @keydown.capture="onKeydown"
  >
    <Transition name="feature-modal">
      <div v-show="Boolean(feature)" class="feature-overlay" :inert="!feature" @click.self="close">
        <div class="feature-window">
          <header class="feature-titlebar">
            <div class="window-controls">
              <button ref="closeButton" class="window-close" type="button" aria-label="Close feature window" @click="close">
                <span aria-hidden="true">×</span>
              </button>
              <span class="window-dot window-dot--yellow" aria-hidden="true" />
              <span class="window-dot window-dot--green" aria-hidden="true" />
            </div>
            <h2 id="feature-window-title">{{ feature?.title }}</h2>
            <NuxtLink to="/" replace class="feature-dismiss">Close <kbd>esc</kbd></NuxtLink>
            <p id="feature-window-summary" class="sr-only">{{ feature?.description }}</p>
          </header>
          <!-- Keep the routed slot mounted even on / so page SEO always runs.
               Feature pages output only the empty whiteboard in phase 1. -->
          <div class="feature-body"><slot /></div>
        </div>
      </div>
    </Transition>
    <slot name="navigation" />
  </section>
</template>
