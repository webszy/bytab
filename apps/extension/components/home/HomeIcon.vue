<script setup lang="ts">
import { computed } from 'vue';
import { homeIcons, type HomeIconName } from './home-icons';

const props = defineProps<{ name: HomeIconName }>();
const icon = computed(() => homeIcons[props.name]);
</script>

<template>
  <svg v-bind="icon.attributes" class="home-icon" aria-hidden="true" focusable="false">
    <component
      :is="shape.tag"
      v-for="(shape, index) in icon.shapes"
      :key="index"
      v-bind="shape.attributes"
    />
  </svg>
</template>
