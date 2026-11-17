<script setup lang="ts">
import { computed, ref } from 'vue';
import { isShortcutFolder, type ShortcutEntry, type ShortcutFolder } from '../../utils/shortcutCollections';
import HomeDialog from './HomeDialog.vue';

const props = defineProps<{ shortcut: ShortcutEntry | null; folder?: boolean; folderId?: string | null; folders?: ShortcutFolder[]; saving: boolean; error: string }>();
const emit = defineEmits<{
  close: [];
  save: [title: string, url: string, folderId: string | null];
  remove: [];
  align: [];
}>();
const title = ref(props.shortcut?.title ?? '');
const isFolder = computed(() => props.folder || (props.shortcut && isShortcutFolder(props.shortcut)));
const url = ref(props.shortcut && !isShortcutFolder(props.shortcut) ? props.shortcut.url : '');
const folderId = ref(props.shortcut && !isShortcutFolder(props.shortcut) ? props.shortcut.folderId ?? '' : props.folderId ?? '');
</script>

<template>
  <HomeDialog :title="isFolder ? shortcut ? 'Edit folder' : 'New folder' : shortcut ? 'Edit shortcut' : 'Add shortcut'" :busy="saving" @close="emit('close')">
    <form class="shortcut-form" @submit.prevent="emit('save', title, url, folderId || null)">
      <label>
        Name
        <input v-model="title" type="text" maxlength="80" required autofocus :disabled="saving" />
      </label>
      <label v-if="!isFolder">
        Website URL
        <input v-model="url" type="url" maxlength="4096" placeholder="https://example.com" required :disabled="saving" />
      </label>
      <label v-if="!isFolder">
        Folder
        <select v-model="folderId" aria-label="Folder" :disabled="saving">
          <option value="">Main bar</option>
          <option v-for="item in folders" :key="item.id" :value="item.id">{{ item.title }}</option>
        </select>
      </label>
      <p v-else class="shortcut-folder-help">Folders hold shortcuts only. Deleting a folder moves its shortcuts back to the main bar.</p>
      <p class="dialog-feedback" role="status">{{ error }}</p>
      <div v-if="shortcut" class="shortcut-edit-tools">
        <button class="text-action text-action--danger" type="button" :disabled="saving" @click="emit('remove')">{{ isFolder ? 'Delete folder' : 'Delete shortcut' }}</button>
        <button v-if="shortcut.position" class="text-action" type="button" :disabled="saving" @click="emit('align')">Return to grid</button>
      </div>
      <footer class="dialog-actions">
        <button class="dialog-button" type="button" :disabled="saving" @click="emit('close')">Cancel</button>
        <button class="dialog-button dialog-button--primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : isFolder ? 'Save folder' : 'Save shortcut' }}</button>
      </footer>
    </form>
  </HomeDialog>
</template>

<style scoped>
select { padding: 10px 12px; border: 1px solid rgb(0 0 0 / 12%); border-radius: 10px; background: rgb(255 255 255 / 80%); font: inherit; }
.shortcut-folder-help { color: #62666d; font-size: 12px; }
</style>
