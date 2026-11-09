<script setup lang="ts">
import HomeIcon from './HomeIcon.vue';

const shortcuts = [
  { label: 'GitHub', icon: 'github', url: 'https://github.com/' },
  { label: 'YouTube', icon: 'youtube', url: 'https://www.youtube.com/' },
  { label: 'ChatGPT', icon: 'chatgpt', url: 'https://chatgpt.com/' },
  { label: 'Google', icon: 'google', url: 'https://www.google.com/' },
  { label: 'Figma', icon: 'figma', url: 'https://www.figma.com/' },
] as const;
</script>

<template>
  <section class="home-shortcuts" aria-labelledby="home-shortcuts-heading">
    <header class="shortcuts-header">
      <h2 id="home-shortcuts-heading"><HomeIcon name="dots" />Frequent Shortcuts</h2>
      <span class="shortcuts-alignment"><span aria-hidden="true" />Grid Aligned</span>
    </header>

    <nav class="shortcut-items" aria-label="Frequent shortcuts">
      <a v-for="shortcut in shortcuts" :key="shortcut.label" :href="shortcut.url" class="shortcut-item" :class="`shortcut-item--${shortcut.icon}`">
        <span class="shortcut-tile"><HomeIcon :name="shortcut.icon" /></span>
        <span class="shortcut-label">{{ shortcut.label }}</span>
      </a>
      <button class="shortcut-item shortcut-item--add" type="button" disabled title="Adding shortcuts is not available yet">
        <span class="shortcut-tile"><HomeIcon name="plus" /></span>
        <span class="shortcut-label">Add</span>
      </button>
    </nav>
  </section>
</template>
