<script setup lang="ts">
import { NuxtLink } from '#components';
import HomeTopBar from '#extension-home/HomeTopBar.vue';

defineEmits<{ settings: [] }>();
</script>

<template>
  <HomeTopBar :link-component="NuxtLink" :show-tagline="false" @settings="$emit('settings')" />
</template>
