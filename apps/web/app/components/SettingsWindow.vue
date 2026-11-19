<script setup lang="ts">
import HomeDialog from '#extension-home/HomeDialog.vue';

defineProps<{ theme: 'light' | 'dark' }>();
defineEmits<{ close: []; theme: [mode: 'light' | 'dark'] }>();

const modes = ['light', 'dark'] as const;
const tints = useHomepageGlassTints();
</script>

<template>
  <HomeDialog id="settings-window" class="appearance-dialog" title="Appearance" @close="$emit('close')">
    <fieldset class="appearance-setting">
      <legend>Theme</legend>
      <div class="theme-options">
        <label v-for="mode in modes" :key="mode" class="dialog-button theme-option">
          <input
            type="radio" name="appearance-theme" :value="mode" :checked="theme === mode"
            @click="$emit('theme', mode)"
          />
          {{ mode === 'light' ? 'Light' : 'Dark' }}
        </label>
      </div>
    </fieldset>
    <fieldset class="appearance-setting glass-tint-setting">
      <legend>Glass tint</legend>
      <div v-for="mode in modes" :key="mode" class="tint-row">
        <label :for="`glass-tint-${mode}`">{{ mode === 'light' ? 'Light mode' : 'Dark mode' }}</label>
        <input
          :id="`glass-tint-${mode}`" v-model.number="tints[mode]"
          type="range" min="0" max="1.5" step="0.05"
          :aria-valuetext="`${Math.round(tints[mode] * 100)}%`"
        />
        <output :for="`glass-tint-${mode}`" aria-hidden="true">{{ Math.round(tints[mode] * 100) }}%</output>
      </div>
    </fieldset>
  </HomeDialog>
</template>

<style scoped>
.appearance-dialog {
  --appearance-accent: light-dark(#0071e3, #8fc4ff);
  border-color: light-dark(rgb(255 255 255 / 90%), rgb(255 255 255 / 16%));
  color: light-dark(#1f2329, #f0f0f5);
  background: light-dark(rgb(255 255 255 / 94%), rgb(28 28 34 / 96%));
}
.appearance-dialog :deep(.dialog-close) {
  color: inherit;
  background: light-dark(rgb(0 0 0 / 5%), rgb(255 255 255 / 8%));
}
.appearance-setting { min-inline-size: 0; margin: 0; padding: 0; border: 0; }
.appearance-setting:first-child-of-type {
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid light-dark(rgb(0 0 0 / 10%), rgb(255 255 255 / 14%));
}
.appearance-setting legend { font-size: 14px; font-weight: 600; }
.theme-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
.theme-option {
  gap: 6px;
  cursor: pointer;
  border-color: light-dark(rgb(0 0 0 / 10%), rgb(255 255 255 / 16%));
  background: light-dark(rgb(255 255 255 / 80%), rgb(255 255 255 / 7%));
}
.theme-option:has(:checked) {
  border-color: var(--appearance-accent);
  color: light-dark(#0068d1, #b3d3ff);
  background: light-dark(rgb(0 113 227 / 9%), rgb(143 196 255 / 16%));
}
.theme-option input { margin: 0; accent-color: var(--appearance-accent); }
.tint-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 4ch;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
}
.glass-tint-setting input { width: 100%; accent-color: var(--appearance-accent); }
.glass-tint-setting output { text-align: right; font-variant-numeric: tabular-nums; }
</style>
