<script setup lang="ts">
import type { PromptProvider } from '../../utils/promptProviders';
import chatgpt from '../../assets/providers/chatgpt.svg';
import claude from '../../assets/providers/claude.svg';
import grok from '../../assets/providers/grok.svg';
import gemini from '../../assets/providers/gemini.png';
import google from '../../assets/providers/google.png';
import bing from '../../assets/providers/bing.png';
defineProps<{ icon: PromptProvider['icon'] }>();
const logos = { chatgpt, claude, grok, gemini, google, bing };
</script>

<template>
  <span class="model-avatar" :class="`model-avatar--${icon}`">
    <img :src="logos[icon]" alt="" aria-hidden="true" draggable="false" />
  </span>
</template>

<style scoped>
.model-avatar {
  grid-template: 100% / 100%;
  background: transparent;
  border-radius: 0;
}
.model-avatar img { display: block; width: 18px; height: 18px; object-fit: contain; }
</style>
