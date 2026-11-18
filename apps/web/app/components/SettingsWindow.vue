<script setup lang="ts">
defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();

const tints = useHomepageGlassTints();
const tintModes = ['light', 'dark'] as const;
</script>

<template>
  <WindowDialog
    id="settings-window"
    class="settings-window"
    :open="open"
    title="Settings"
    return-focus-id="home-settings"
    @close="$emit('close')"
  >
    <fieldset class="glass-tint-settings">
      <legend>Glass tint</legend>
      <div v-for="mode in tintModes" :key="mode" class="glass-tint-setting">
        <label :for="`glass-tint-${mode}`">
          {{ mode === 'light' ? 'Light mode' : 'Dark mode' }}
          <output :for="`glass-tint-${mode}`" aria-hidden="true">{{ Math.round(tints[mode] * 100) }}%</output>
        </label>
        <input
          :id="`glass-tint-${mode}`"
          v-model.number="tints[mode]"
          type="range"
          min="0"
          max="1.5"
          step="0.05"
          :aria-valuetext="`${Math.round(tints[mode] * 100)}%`"
        />
      </div>
    </fieldset>
  </WindowDialog>
</template>

<style scoped>
.settings-window { --window-width: 440px; }

.glass-tint-settings {
  min-inline-size: 0;
  margin: 0;
  padding: 24px;
  border: 0;
}

.glass-tint-settings legend {
  float: left;
  width: 100%;
  margin-bottom: 16px;
  font-weight: 600;
}

.glass-tint-setting + .glass-tint-setting { margin-top: 16px; }
.glass-tint-setting label { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
.glass-tint-setting output { font-variant-numeric: tabular-nums; }
.glass-tint-setting input {
  display: block;
  width: 100%;
  margin: 6px 0 0;
  accent-color: var(--window-focus);
}
.glass-tint-setting input:focus-visible { outline: 2px solid var(--window-focus); outline-offset: 3px; }
</style>
