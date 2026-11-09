<script setup lang="ts">
import HomeIcon from '#extension-home/HomeIcon.vue';
import type { HomeIconName } from '#extension-home/home-icons';

const props = defineProps<{ name: HomeIconName | 'dock' | 'shield' }>();
const originalIcon = computed(() => props.name === 'dock' || props.name === 'shield' ? undefined : props.name);
</script>

<template>
  <HomeIcon v-if="originalIcon" :name="originalIcon" />
  <svg v-else class="home-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <template v-if="name === 'dock'">
      <rect x="2" y="6" width="20" height="14" rx="4" />
      <path d="M2 15h20M7 10h.01M12 10h.01M17 10h.01" />
    </template>
    <template v-else>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
      <path d="m8.5 11.5 2.5 2.5 4.5-5" />
    </template>
  </svg>
</template>
