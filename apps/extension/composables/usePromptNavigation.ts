import { ref } from 'vue';
import { openWebsite } from '../utils/navigation';
import { promptDestination, type PromptService } from '../utils/promptProviders';

export interface PromptRequest {
  service: PromptService;
  prompt: string;
}

export function usePromptNavigation() {
  const busy = ref(false);
  const feedback = ref('');

  async function send({ service, prompt }: PromptRequest) {
    if (busy.value) return;
    const destination = promptDestination(service, prompt);
    if (!destination) return;
    busy.value = true;
    feedback.value = '';
    try {
      // Persist only the provider homepage, never the submitted prompt/query URL.
      await openWebsite(destination.provider.label, destination.url, destination.provider.home);
    } catch {
      feedback.value = `Could not open ${destination.provider.label}. Try again.`;
    } finally {
      busy.value = false;
    }
  }

  return { busy, feedback, send };
}
