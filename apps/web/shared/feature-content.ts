import type { siteFeatures } from './site';

export type FeatureGlyph = 'bookmark' | 'search' | 'shield' | 'dock' | 'sparkle' | 'globe' | 'settings' | 'folder';

export interface FeatureLink {
  label: string;
  to: string;
}

export interface FeatureModule {
  icon: FeatureGlyph;
  title: string;
  description: string;
}

export interface FeatureContent {
  heroTitle: string;
  heroSubtitle: string;
  modules: readonly FeatureModule[];
  tags: readonly string[];
  linksLabel?: string;
  links?: readonly FeatureLink[];
  linksTone?: 'emphasis' | 'quiet';
}

type FeatureId = typeof siteFeatures[number]['id'];

export const featureContent = {
  bookmarks: {
    heroTitle: 'Chrome Bookmarks on Your New Tab',
    heroSubtitle: 'Open a new tab and browse the Chrome bookmarks you already have, with your existing folders ready to use.',
    modules: [
      {
        icon: 'bookmark',
        title: 'Browse Bookmark Folders',
        description: 'Explore your saved pages in All Bookmarks or open your Chrome folders from the Dock.',
      },
      {
        icon: 'search',
        title: 'Instant Local Search',
        description: 'Type part of a page title or URL to find a matching bookmark in your browser.',
      },
      {
        icon: 'shield',
        title: 'Start Without Importing',
        description: 'bytab reads your existing bookmark tree locally, with no importing, bookmark uploads, or bytab account required.',
      },
    ],
    tags: ['Chrome Bookmarks', 'Local-first', 'No Account Needed'],
  },
  dock: {
    heroTitle: 'Custom Shortcuts and Bookmark Dock',
    heroSubtitle: 'Keep frequently used websites in the shortcut bar and reach your Chrome bookmark folders from a liquid glass Dock.',
    modules: [
      {
        icon: 'dock',
        title: 'Add Everyday Websites',
        description: 'Add shortcuts for the sites you visit often and arrange them in the order you use them.',
      },
      {
        icon: 'folder',
        title: 'Group Related Shortcuts',
        description: 'Use shortcut folders to keep work, reading, or other related websites together.',
      },
      {
        icon: 'settings',
        title: 'Choose a Dock Position',
        description: 'Place the Dock at the top, bottom, left, or right edge of your new tab in Settings.',
      },
    ],
    tags: ['Website Shortcuts', 'Shortcut Folders', 'Four Dock Positions'],
  },
  search: {
    heroTitle: 'AI Prompt Bar and Quick Search',
    heroSubtitle: 'Choose an AI or search service in the Prompt Bar. bytab opens that service, which processes your request and runs any AI models.',
    modules: [
      {
        icon: 'bookmark',
        title: 'Open a Saved Page',
        description: 'Type a title or URL to find a Chrome bookmark locally and open it from the same bar.',
      },
      {
        icon: 'globe',
        title: 'Search the Web',
        description: 'Choose Google or Bing to open search results for your query in a new tab.',
      },
      {
        icon: 'sparkle',
        title: 'Launch a Third-party AI Tool',
        description: 'Open ChatGPT, Claude, Grok, or Gemini. Gemini autofill uses optional site access. You can paste your prompt when that access is off.',
      },
    ],
    tags: ['Bookmark Search', 'Web Search', 'AI Shortcuts'],
  },
  appearance: {
    heroTitle: 'Liquid Glass Themes and Wallpapers',
    heroSubtitle: 'Personalize your Chrome new tab with liquid glass styling, your own wallpaper, and a Dock that fits your workspace.',
    modules: [
      {
        icon: 'sparkle',
        title: 'Choose Your Wallpaper',
        description: 'Use the built-in wallpaper or set an image of your own as the new tab background.',
      },
      {
        icon: 'settings',
        title: 'Light, Dark, or System',
        description: 'Pick a light or dark appearance, or let bytab follow your system preference.',
      },
      {
        icon: 'dock',
        title: 'Customize the Dock',
        description: 'Choose any of the four screen edges for your Dock in Appearance settings.',
      },
    ],
    tags: ['Liquid Glass', 'Custom Wallpapers', 'Flexible Dock'],
    linksLabel: 'Policies',
    linksTone: 'quiet',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Use', to: '/terms' },
    ],
  },
  privacy: {
    heroTitle: 'Local-first Privacy for Chrome',
    heroSubtitle: 'bytab reads your Chrome bookmarks on your device. You can use the new tab without creating a bytab account.',
    modules: [
      {
        icon: 'shield',
        title: 'No Bookmark Uploads',
        description: 'Bookmark browsing and search run in your browser using the Chrome bookmarks API. bytab never uploads your bookmarks.',
      },
      {
        icon: 'settings',
        title: 'Browser-local Settings',
        description: 'Preferences and shortcuts are saved in Chrome local storage. Custom wallpapers are saved in IndexedDB on your device.',
      },
      {
        icon: 'globe',
        title: 'Third-party Prompt Routing',
        description: 'When you submit a prompt or search, the third-party service you select processes it under its own privacy policy.',
      },
    ],
    tags: ['Local-first', 'No Bookmark Uploads', 'No Account Needed'],
    linksTone: 'emphasis',
    links: [
      { label: 'Read Privacy Policy', to: '/privacy' },
      { label: 'Read Terms of Use', to: '/terms' },
    ],
  },
} as const satisfies Record<FeatureId, FeatureContent>;

export function findFeatureContent(id: string): FeatureContent | undefined {
  return featureContent[id as FeatureId];
}
