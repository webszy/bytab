<script setup lang="ts">
import { dockPositions, type DockPosition } from '../../utils/appearance';
import defaultWallpaper from '../../assets/wallpapers/default.png';
import HomeDialog from './HomeDialog.vue';

defineProps<{
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
  position: [position: DockPosition];
  file: [file: File];
  default: [];
  apply: [];
  restore: [];
}>();

function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit('file', file);
  input.value = '';
}
</script>

<template>
  <HomeDialog title="Appearance" :busy="saving || preparing" @close="emit('close')">
    <fieldset class="dock-position-setting" :disabled="loading || dockSaving">
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
    <h3 class="appearance-background-title">Background</h3>
    <img class="background-preview" :src="previewUrl || defaultWallpaper" alt="Background preview" />
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
