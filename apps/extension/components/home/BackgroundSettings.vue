<script setup lang="ts">
import defaultWallpaper from '../../assets/wallpapers/default.png';
import HomeDialog from './HomeDialog.vue';

defineProps<{
  previewUrl: string;
  preparing: boolean;
  saving: boolean;
  loading: boolean;
  error: string;
}>();
const emit = defineEmits<{
  close: [];
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
  <HomeDialog title="Background settings" :busy="saving || preparing" @close="emit('close')">
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
