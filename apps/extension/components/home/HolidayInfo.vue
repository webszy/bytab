<script setup lang="ts">
import HomeIcon from './HomeIcon.vue';

defineProps<{ label?: string; confirmed?: boolean }>();
</script>

<template>
  <p v-if="label" class="home-holiday">
    <HomeIcon name="calendar" />
    <span>{{ label }}</span>
    <span v-if="!confirmed" class="sr-only">Preview placeholder. Not a confirmed holiday.</span>
  </p>
</template>
