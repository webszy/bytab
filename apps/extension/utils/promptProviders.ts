export const promptProviders = [
  { id: 'chatgpt', label: 'ChatGPT', icon: 'chatgpt', group: 'AI Assistants', enabled: true, home: 'https://chatgpt.com/', target: 'https://chatgpt.com/?prompt=' },
  { id: 'claude', label: 'Claude', icon: 'claude', group: 'AI Assistants', enabled: true, home: 'https://claude.ai/', target: 'https://claude.ai/new?q=' },
  { id: 'grok', label: 'Grok', icon: 'grok', group: 'AI Assistants', enabled: true, home: 'https://grok.com/', target: 'https://grok.com/?q=' },
  { id: 'gemini', label: 'Gemini', icon: 'gemini', group: 'AI Assistants', enabled: false, home: 'https://gemini.google.com/', target: null },
  { id: 'google', label: 'Google', icon: 'google', group: 'Web Search', enabled: true, home: 'https://www.google.com/', target: 'https://www.google.com/search?q=' },
  { id: 'bing', label: 'Bing', icon: 'bing', group: 'Web Search', enabled: true, home: 'https://www.bing.com/', target: 'https://www.bing.com/search?q=' },
] as const;

export type PromptProvider = typeof promptProviders[number];
export type PromptService = PromptProvider['id'];
export type EnabledPromptService = Exclude<PromptService, 'gemini'>;

export function parsePromptProvider(value: unknown): EnabledPromptService {
  const provider = promptProviders.find(item => item.id === value);
  return provider?.enabled ? provider.id : 'chatgpt';
}

export function promptDestination(service: unknown, prompt: string) {
  const provider = promptProviders.find(item => item.id === service && item.enabled);
  const text = prompt.trim();
  if (!provider?.target || !text) return null;
  return { provider, url: provider.target + encodeURIComponent(text) };
}
