<script setup lang="ts">
import HomeIcon from '#extension-home/HomeIcon.vue';
import PromptProviderIcon from '#extension-home/PromptProviderIcon.vue';

defineProps<{ open: boolean; otherOpen: boolean }>();
defineEmits<{ 'update:open': [open: boolean] }>();
</script>

<template>
  <PreviewTooltip
    class="home-prompt extension-prompt prompt-preview"
    button-class="preview-trigger"
    :open="open"
    :other-open="otherOpen"
    label="About the prompt bar in the Chrome extension"
    description="Start a web search or quickly open your favorite AI tools from your new tab."
    @update:open="$emit('update:open', $event)"
  >
    <span class="prompt-symbol" aria-hidden="true"><HomeIcon name="sparkle" /></span>
    <span class="prompt-input">Ask anything...</span>
    <span class="prompt-actions" aria-hidden="true">
      <span class="model-trigger"><PromptProviderIcon icon="chatgpt" /><span class="model-label">ChatGPT</span></span>
      <span class="prompt-send"><HomeIcon name="send" /></span>
    </span>
  </PreviewTooltip>
</template>

<style scoped>
.prompt-preview { padding: 0; }
.prompt-preview :deep(.preview-trigger) {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  padding: 0 14px;
  border: 0;
  border-radius: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.prompt-preview :deep(.preview-trigger:focus-visible) { outline: 2px solid #0071e3; outline-offset: 3px; }
.prompt-input {
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  user-select: none;
}
.prompt-preview .prompt-send { background: #8c6bc8; opacity: .55; }
</style>
