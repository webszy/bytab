<script setup lang="ts">
import { computed } from 'vue';
import { useGeminiHandoff } from '../../composables/useGeminiHandoff';
import { usePromptNavigation } from '../../composables/usePromptNavigation';
import { usePromptProvider } from '../../composables/usePromptProvider';
import type { BookmarkSearchEntry } from '../../utils/bookmarkTree';
import { openWebsite } from '../../utils/navigation';
import type { PromptService } from '../../utils/promptProviders';
import PromptBar from './PromptBar.vue';

defineProps<{ bookmarks: BookmarkSearchEntry[] }>();
const { value: provider, loading, error, saveError, select } = usePromptProvider();
const { busy: sending, feedback, send } = usePromptNavigation();
const gemini = useGeminiHandoff();
const { notice, recoveryPrompt } = gemini;
const busy = computed(() => sending.value || gemini.busy.value);

async function submit(service: PromptService, prompt: string) {
  if (service === 'gemini') return gemini.send(prompt);
  gemini.dismiss();
  await send({ service, prompt });
}
</script>

<template>
  <PromptBar
    enabled
    :provider="provider"
    :provider-loading="loading"
    :bookmarks="bookmarks"
    :busy="busy"
    :feedback="feedback || saveError || error"
    :open-bookmark-url="openWebsite"
    @update:provider="select"
    @clear-feedback="feedback = ''"
    @send="submit"
  />
  <Teleport to="body">
    <Transition name="handoff">
      <aside v-if="notice" class="handoff-toast" aria-label="Gemini prompt handoff">
        <div role="status">
          <strong v-if="notice === 'copied'"><span aria-hidden="true">✓</span> Prompt copied!</strong>
          <strong v-else>{{ notice === 'copy-failed' ? "Couldn't copy prompt" : "Couldn't open Gemini" }}</strong>
          <p>{{ notice === 'copied' ? 'Paste it into Gemini to continue.' : 'You can also select and copy your prompt below.' }}</p>
        </div>
        <template v-if="notice !== 'copied'">
          <textarea readonly aria-label="Prompt to copy" :value="recoveryPrompt" @focus="($event.target as HTMLTextAreaElement).select()" />
          <div class="handoff-actions">
            <button type="button" :disabled="busy" @click="gemini.recover(true)">Copy Prompt</button>
            <button type="button" :disabled="busy" @click="gemini.recover(false)">Open Gemini</button>
            <button type="button" :disabled="busy" @click="gemini.dismiss">Dismiss</button>
          </div>
        </template>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.handoff-toast { position: fixed; z-index: 100; right: 18px; bottom: 18px; box-sizing: border-box; max-width: calc(100vw - 36px); padding: 14px 18px; border: 1px solid #ffffff38; border-radius: 16px; background: rgb(25 27 34 / 94%); color: white; backdrop-filter: blur(18px); box-shadow: 0 6px 24px #0003; font: 14px/1.4 system-ui, sans-serif; }
.handoff-toast strong span { color: #8de2b0; }
.handoff-toast p { margin: 4px 0 0; color: #e3e4ea; }
.handoff-toast textarea { box-sizing: border-box; width: 100%; margin: 10px 0; }
.handoff-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.handoff-actions button { padding: 5px 9px; border: 1px solid #ffffff54; border-radius: 8px; background: transparent; color: white; cursor: pointer; }
.handoff-enter-active, .handoff-leave-active { transition: opacity 150ms; }
.handoff-enter-from, .handoff-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .handoff-enter-active, .handoff-leave-active { transition: none; } }
</style>
