<script setup lang="ts">
import { ref } from 'vue';
import type { Shortcut } from '../../utils/shortcuts';
import HomeDialog from './HomeDialog.vue';

const props = defineProps<{ shortcut: Shortcut | null; saving: boolean; error: string }>();
const emit = defineEmits<{
  close: [];
  save: [title: string, url: string];
  remove: [];
  align: [];
}>();
const title = ref(props.shortcut?.title ?? '');
const url = ref(props.shortcut?.url ?? '');
</script>

<template>
  <HomeDialog :title="shortcut ? 'Edit shortcut' : 'Add shortcut'" :busy="saving" @close="emit('close')">
    <form class="shortcut-form" @submit.prevent="emit('save', title, url)">
      <label>
        Name
        <input v-model="title" type="text" maxlength="80" required autofocus :disabled="saving" />
      </label>
      <label>
        Website URL
        <input v-model="url" type="url" maxlength="4096" placeholder="https://example.com" required :disabled="saving" />
      </label>
      <p class="dialog-feedback" role="status">{{ error }}</p>
      <div v-if="shortcut" class="shortcut-edit-tools">
        <button class="text-action text-action--danger" type="button" :disabled="saving" @click="emit('remove')">Delete shortcut</button>
        <button v-if="shortcut.position" class="text-action" type="button" :disabled="saving" @click="emit('align')">Return to grid</button>
      </div>
      <footer class="dialog-actions">
        <button class="dialog-button" type="button" :disabled="saving" @click="emit('close')">Cancel</button>
        <button class="dialog-button dialog-button--primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save shortcut' }}</button>
      </footer>
    </form>
  </HomeDialog>
</template>
