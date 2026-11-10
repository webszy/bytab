<script setup lang="ts">
import type { LastOpened } from '../../utils/navigation';
import { websiteLabel } from '../../utils/urls';
import RecentPageCard from './RecentPageCard.vue';

defineProps<{
  opened: LastOpened | null;
  openedLoading: boolean;
  openedError: string;
  closedTitle: string;
  closedSubtitle: string;
  hasClosedTab: boolean;
  closedLoading: boolean;
  restoring: boolean;
  closedError: string;
}>();
defineEmits<{ reopen: []; restore: [] }>();
</script>

<template>
  <section class="home-recent" aria-label="Recent pages">
    <RecentPageCard
      title="Last Opened"
      icon="arrowUpRight"
      mark="arrowUpRight"
      :primary="openedLoading ? 'Loading…' : openedError ? 'Last opened unavailable' : opened?.title || 'No recently opened page'"
      :secondary="openedError || (opened ? websiteLabel(opened.url) : 'Open a website through bytab')"
      :disabled="openedLoading || !opened"
      @activate="$emit('reopen')"
    />
    <RecentPageCard
      title="Last Closed"
      icon="history"
      mark="history"
      :primary="restoring ? 'Restoring…' : closedLoading ? 'Loading…' : hasClosedTab ? closedTitle : closedError ? 'Recently closed unavailable' : 'No recently closed tabs'"
      :secondary="closedError || closedSubtitle"
      :disabled="closedLoading || (!hasClosedTab && !closedError)"
      :busy="restoring"
      @activate="$emit('restore')"
    />
    <span class="sr-only" role="status">{{ closedError || openedError }}</span>
  </section>
</template>
