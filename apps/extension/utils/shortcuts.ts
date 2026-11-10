import type { HomeIconName } from '../components/home/home-icons';
import { websiteUrl } from './urls';

export interface ShortcutPosition {
  x: number;
  y: number;
}

export interface Shortcut {
  id: string;
  title: string;
  url: string;
  position?: ShortcutPosition;
}

export const defaultShortcuts: Shortcut[] = [
  { id: 'github', title: 'GitHub', url: 'https://github.com/' },
  { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com/' },
  { id: 'chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'google', title: 'Google', url: 'https://www.google.com/' },
  { id: 'figma', title: 'Figma', url: 'https://www.figma.com/' },
];

export function shortcutIcon(url: string): HomeIconName | undefined {
  const hostname = websiteUrl(url)?.hostname.replace(/^www\./, '');
  const icons: Record<string, HomeIconName> = {
    'github.com': 'github',
    'youtube.com': 'youtube',
    'chatgpt.com': 'chatgpt',
    'google.com': 'google',
    'figma.com': 'figma',
  };
  return hostname ? icons[hostname] : undefined;
}
