<script setup lang="ts">
import { dockPositions, themePreferences, type DockPosition, type GlassMode, type ThemePreference } from '../../utils/appearance';
import defaultWallpaper from '../../assets/wallpapers/default.png';
import darkWallpaper from '../../assets/wallpapers/dark.webp';
import HomeDialog from './HomeDialog.vue';

defineProps<{
  theme: ThemePreference;
  effectiveTheme: GlassMode;
  themeError: string;
  glassTints: Record<GlassMode, number>;
  tintError: string;
  dockPosition: DockPosition;
  dockSaving: boolean;
  dockError: string;
  previewUrl: string;
  preparing: boolean;
  saving: boolean;
  loading: boolean;
  error: string;
}>();
const emit = defineEmits<{
  close: [];
  theme: [preference: ThemePreference];
  previewTint: [mode: GlassMode, value: number];
  saveTint: [mode: GlassMode, value: number];
  position: [position: DockPosition];
  file: [file: File];
  default: [];
  apply: [];
  restore: [];
}>();

const tintModes = ['light', 'dark'] as const;

function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit('file', file);
  input.value = '';
}
</script>

<template>
  <HomeDialog class="appearance-dialog" title="Appearance" :busy="saving || preparing" @close="emit('close')">
    <fieldset class="appearance-setting" :disabled="loading">
      <legend>Theme</legend>
      <div class="theme-options">
        <label v-for="preference in themePreferences" :key="preference" class="dialog-button theme-option">
          <input type="radio" name="appearance-theme" :value="preference" :checked="theme === preference"
            @change="emit('theme', preference)" />
          {{ preference.charAt(0).toUpperCase() + preference.slice(1) }}
        </label>
      </div>
      <p v-if="themeError" class="dialog-feedback" role="alert">{{ themeError }}</p>
    </fieldset>
    <fieldset class="appearance-setting" :disabled="loading || dockSaving">
      <legend>Dock Position</legend>
      <p class="dialog-help">Choose where your Dock appears.</p>
      <div class="dock-position-options">
        <button v-for="position in dockPositions" :key="position" type="button" class="dialog-button"
          :aria-pressed="dockPosition === position" @click="emit('position', position)">
          <span class="dock-position-preview" :data-edge="position" aria-hidden="true" />
          {{ position.charAt(0).toUpperCase() + position.slice(1) }}
        </button>
      </div>
      <p v-if="dockError" class="dialog-feedback" role="alert">{{ dockError }}</p>
    </fieldset>
    <fieldset class="appearance-setting glass-tint-setting" :disabled="loading">
      <legend>Glass tint</legend>
      <label v-for="mode in tintModes" :key="mode">
        <span>{{ mode === 'light' ? 'Light mode' : 'Dark mode' }}</span>
        <input type="range" min="0" max="1.5" step="0.05" :value="glassTints[mode]"
          :aria-valuetext="Math.round(glassTints[mode] * 100) + '%'"
          @input="emit('previewTint', mode, ($event.target as HTMLInputElement).valueAsNumber)"
          @change="emit('saveTint', mode, ($event.target as HTMLInputElement).valueAsNumber)" />
        <span class="tint-value" aria-hidden="true">{{ Math.round(glassTints[mode] * 100) }}%</span>
      </label>
      <p v-if="tintError" class="dialog-feedback" role="alert">{{ tintError }}</p>
    </fieldset>
    <h3 class="appearance-background-title">Background</h3>
    <img class="background-preview" :src="previewUrl || (effectiveTheme === 'dark' ? darkWallpaper : defaultWallpaper)" alt="Background preview" />
    <div class="background-options">
      <button class="dialog-button" type="button" :disabled="saving || preparing" @click="emit('default')">Use default background</button>
      <label class="dialog-button background-upload" :aria-disabled="saving || preparing">
        Upload image
        <input type="file" accept="image/jpeg,image/png,image/webp" :disabled="saving || preparing || loading" @change="onFile" />
      </label>
    </div>
    <p class="dialog-help">JPG, PNG or WebP, up to 20 MB and 40 megapixels. Images are processed and saved on this device.</p>
    <p class="dialog-feedback" role="status">{{ error || (preparing ? 'Preparing image…' : saving ? 'Saving background…' : '') }}</p>
    <footer class="dialog-actions">
      <button class="text-action" type="button" :disabled="saving || preparing || loading" @click="emit('restore')">Restore default</button>
      <button class="dialog-button dialog-button--primary" type="button" :disabled="saving || preparing || loading" @click="emit('apply')">Apply background</button>
    </footer>
  </HomeDialog>
</template>

<style scoped>
.appearance-dialog {
  --appearance-accent: light-dark(#0071e3, #8fc4ff);
  border-color: light-dark(rgb(255 255 255 / 90%), rgb(255 255 255 / 16%));
  color: light-dark(#1f2329, #f0f0f5);
  background: light-dark(rgb(255 255 255 / 94%), rgb(28 28 34 / 96%));
}
.appearance-dialog::-webkit-scrollbar { width: 10px; background: transparent; }
.appearance-dialog::-webkit-scrollbar-track { margin-block: 20px; background: transparent; }
.appearance-dialog::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: light-dark(rgb(31 35 41 / 38%), rgb(255 255 255 / 42%)) padding-box;
}
.appearance-dialog :deep(.dialog-close) {
  color: inherit;
  background: light-dark(rgb(0 0 0 / 5%), rgb(255 255 255 / 8%));
}
.appearance-dialog :where(.dialog-button:not(.dialog-button--primary)) {
  border-color: light-dark(rgb(0 0 0 / 10%), rgb(255 255 255 / 16%));
  background: light-dark(rgb(255 255 255 / 80%), rgb(255 255 255 / 7%));
}
.dialog-help { color: light-dark(rgb(31 35 41 / 65%), rgb(235 235 245 / 72%)); }
.dialog-feedback { color: light-dark(#b42318, #ff9c95); }
.text-action { color: var(--appearance-accent); }
.appearance-setting {
  margin: 0 0 18px;
  padding: 0 0 18px;
  border: 0;
  border-bottom: 1px solid light-dark(rgb(0 0 0 / 10%), rgb(255 255 255 / 14%));
}
.appearance-setting legend, .appearance-background-title { font-size: 14px; font-weight: 600; }
.theme-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
.theme-option { gap: 6px; padding-inline: 4px; cursor: pointer; }
.theme-option input { margin: 0; accent-color: var(--appearance-accent); }
.theme-option:has(:checked), .dock-position-options [aria-pressed='true'] {
  border-color: var(--appearance-accent);
  color: light-dark(#0068d1, #b3d3ff);
  background: light-dark(rgb(0 113 227 / 9%), rgb(143 196 255 / 16%));
}
.glass-tint-setting label { display: grid; grid-template-columns: auto minmax(0, 1fr) 4ch; align-items: center; gap: 12px; margin-top: 8px; font-size: 12px; }
.glass-tint-setting input { width: 100%; accent-color: var(--appearance-accent); }
.glass-tint-setting .tint-value { text-align: right; font-variant-numeric: tabular-nums; }
</style>
