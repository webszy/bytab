<script setup lang="ts">
import type { SiteIntro } from '#shared/intros';

defineProps<{ intro?: SiteIntro | null; restoreFocus?: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <WindowDialog
    id="intro-window"
    :open="Boolean(intro)"
    :title="intro?.title"
    :description="intro?.subtitle"
    :return-focus-id="intro ? `intro-${intro.id}` : undefined"
    :restore-focus="restoreFocus"
    :trap-focus="false"
    @close="$emit('close')"
  >
    <article v-if="intro" class="feature-intro">
      <p class="feature-intro-subtitle">{{ intro.subtitle }}</p>
      <p class="feature-intro-copy">{{ intro.description }}</p>
      <ul class="feature-intro-tags">
        <li v-for="tag in intro.tags" :key="tag">{{ tag }}</li>
      </ul>
      <p class="feature-intro-footer">{{ intro.footer }}</p>
    </article>
  </WindowDialog>
</template>
