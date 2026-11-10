<script setup lang="ts">
import { computed } from 'vue';
import { folderLabel, isBookmark, type BookmarkNode } from '../../utils/bookmarkTree';
import { websiteLabel, websiteUrl } from '../../utils/urls';
import HomeIcon from './HomeIcon.vue';

const props = defineProps<{
  node: BookmarkNode;
  folderPath?: string;
  selected?: boolean;
}>();
defineEmits<{ open: [node: BookmarkNode] }>();
const bookmark = computed(() => isBookmark(props.node));
const domain = computed(() => websiteLabel(props.node.url ?? ''));
const title = computed(() => bookmark.value
  ? props.node.title.trim() || domain.value || 'Untitled bookmark'
  : folderLabel(props.node));
const valid = computed(() => !bookmark.value || !!websiteUrl(props.node.url ?? ''));
const monogram = computed(() => Array.from(domain.value.replace(/^www\./, '') || title.value)[0]?.toUpperCase());
</script>

<template>
  <button
    class="bookmark-entry"
    :class="{ 'bookmark-entry--folder': !bookmark, 'is-active': selected, 'is-invalid': !valid }"
    type="button"
    :title="[title, node.url, folderPath].filter(Boolean).join('\n')"
    :role="selected === undefined ? undefined : 'option'"
    :aria-selected="selected"
    @click="$emit('open', node)"
  >
    <span class="bookmark-entry-icon" aria-hidden="true">
      <HomeIcon v-if="!bookmark" name="folder" />
      <span v-else-if="valid && monogram" class="bookmark-monogram">{{ monogram }}</span>
      <HomeIcon v-else name="globe" />
    </span>
    <span class="bookmark-entry-copy">
      <span class="bookmark-entry-title">{{ title }}</span>
      <small>{{ bookmark ? domain || 'Unsupported address' : `${node.children?.length ?? 0} items` }}</small>
      <small v-if="folderPath" class="bookmark-entry-path">{{ folderPath }}</small>
    </span>
    <HomeIcon v-if="!bookmark" name="chevron" class="bookmark-folder-chevron" />
  </button>
</template>
