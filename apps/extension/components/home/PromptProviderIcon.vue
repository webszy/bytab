<script setup lang="ts">
import type { PromptProvider } from '../../utils/promptProviders';
import chatgpt from '../../assets/providers/chatgpt.svg';
import claude from '../../assets/providers/claude.svg';
import grok from '../../assets/providers/grok.svg';
import gemini from '../../assets/providers/gemini.svg';
import bing from '../../assets/providers/bing.svg';
import HomeIcon from './HomeIcon.vue';

defineProps<{ icon: PromptProvider['icon'] }>();
const logos = { chatgpt, claude, grok, gemini, bing };
</script>

<template>
  <span class="model-avatar" :class="`model-avatar--${icon}`">
    <HomeIcon v-if="icon === 'google'" name="google" class="provider-logo" />
    <img v-else class="provider-logo" :src="logos[icon]" alt="" aria-hidden="true" draggable="false" />
  </span>
</template>

<style scoped>
.model-avatar {
  grid-template: 100% / 100%;
  background: transparent;
  border-radius: 0;
}
.model-avatar .provider-logo { display: block; width: 18px; height: 18px; object-fit: contain; }

.extension-home[data-theme='dark'] .provider-logo { filter: brightness(0) invert(1); }
</style>
