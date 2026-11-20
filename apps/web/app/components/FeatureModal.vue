<script setup lang="ts">
import type { SiteFeature } from '#shared/site';

defineProps<{ feature?: SiteFeature }>();

function close() {
  // Replace avoids creating a Back -> reopen -> close history loop. Direct visits
  // are safe too: closing always stays on this website.
  return navigateTo('/', { replace: true });
}
</script>

<template>
  <!-- Include the persistent Dock in the dialog's keyboard and accessibility
       scope so visitors can switch features while the window stays open. -->
  <WindowDialog
    id="feature-window"
    class="feature-layer"
    :open="Boolean(feature)"
    :title="feature?.title"
    description-id="feature-summary"
    :return-focus-id="feature ? `dock-${feature.id}` : undefined"
    keep-mounted
    @close="close"
  >
    <slot />
    <template #outside>
      <slot name="intro" />
      <slot name="navigation" />
    </template>
  </WindowDialog>
</template>
