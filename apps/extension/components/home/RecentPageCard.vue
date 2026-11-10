<script setup lang="ts">
import HomeIcon from './HomeIcon.vue';
import type { HomeIconName } from './home-icons';

defineProps<{
  title: string;
  icon: HomeIconName;
  primary: string;
  secondary: string;
  mark?: HomeIconName;
  disabled?: boolean;
  busy?: boolean;
}>();
defineEmits<{ activate: [] }>();
</script>

<template>
  <button class="recent-card" type="button" :disabled="disabled || busy" :aria-busy="busy" :title="secondary" @click="$emit('activate')">
    <span class="recent-card-kicker">
      <HomeIcon :name="icon" />
      <span>{{ title }}</span>
    </span>
    <span class="recent-card-content">
      <span v-if="mark" class="recent-card-mark" :class="`recent-card-mark--${mark}`" aria-hidden="true">
        <HomeIcon :name="mark" />
      </span>
      <span class="recent-card-copy">
        <span class="recent-card-primary">{{ primary }}</span>
        <span class="recent-card-secondary">{{ secondary }}</span>
      </span>
    </span>
  </button>
</template>
