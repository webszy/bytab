import { ref } from 'vue';
import { openWebsite } from '../utils/navigation';

export type PromptService = 'chatgpt' | 'gemini' | 'claude' | 'google';
export interface PromptRequest {
  service: PromptService;
  prompt: string;
}

const services = {
  chatgpt: { title: 'ChatGPT', url: 'https://chatgpt.com/' },
  gemini: { title: 'Gemini', url: 'https://gemini.google.com/' },
  claude: { title: 'Claude', url: 'https://claude.ai/' },
  google: { title: 'Google Search', url: 'https://www.google.com/' },
} as const;

export function usePromptNavigation() {
  const busy = ref(false);
  const feedback = ref('');
  const manualCopy = ref(false);

  async function send({ service, prompt }: PromptRequest) {
    const text = prompt.trim();
    if (!text || busy.value) return;
    busy.value = true;
    manualCopy.value = false;
    feedback.value = '';
    const destination = services[service];
    let url = destination.url as string;
    let copied = false;
    if (service === 'google') {
      const query = new URL('/search', destination.url);
      query.searchParams.set('q', text);
      url = query.href;
    } else {
      try {
        // Called directly from the user's submit action, without clipboard permissions.
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        manualCopy.value = true;
      }
    }
    try {
      // Only the service homepage is recorded. Search queries and prompts stay out of storage.
      await openWebsite(destination.title, url, destination.url);
      if (service !== 'google') {
        feedback.value = copied
          ? `Copied. Paste into ${destination.title} and send when ready.`
          : `Clipboard access failed. Select and copy your prompt, then paste into ${destination.title}.`;
      }
    } catch {
      feedback.value = `Could not open ${destination.title}. Try again.`;
    } finally {
      busy.value = false;
    }
  }

  return { busy, feedback, manualCopy, send };
}
