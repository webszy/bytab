<script setup lang="ts">
import { NuxtLink } from '#components';
import HomeTopBar from '#extension-home/HomeTopBar.vue';

defineEmits<{ settings: [] }>();
</script>

<template>
  <HomeTopBar :link-component="NuxtLink" @settings="$emit('settings')" />
</template>
