import { siteFeatures } from './site';

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
    heroTitle: 'Your Bookmarks, Reimagined',
    heroSubtitle: 'Everything you\'ve saved. One beautiful place.',
    modules: [
      {
        icon: 'bookmark',
        title: 'All Your Bookmarks',
        description: 'Your existing Chrome bookmarks, right where you need them.',
      },
      {
        icon: 'search',
        title: 'Find Things Faster',
        description: 'Quickly search and revisit the pages you\'ve saved.',
      },
      {
        icon: 'shield',
        title: 'Local by Design',
        description: 'Your bookmarks stay in your browser, not on bytab servers.',
      },
    ],
    tags: ['Chrome Native', 'Local-first', 'No Bookmark Uploads'],
  },
  dock: {
    heroTitle: 'Everything Within Reach',
    heroSubtitle: 'A simpler way to move through your day.',
    modules: [
      {
        icon: 'dock',
        title: 'Always Close',
        description: 'Your important destinations stay easy to reach.',
      },
      {
        icon: 'sparkle',
        title: 'Less Clutter',
        description: 'A clean, familiar interface that lets your space breathe.',
      },
      {
        icon: 'folder',
        title: 'Made for Your Flow',
        description: 'Keep your browsing experience simple and comfortable.',
      },
    ],
    tags: ['Simple', 'Accessible', 'Organized'],
  },
  search: {
    heroTitle: 'Search. Ask. Go.',
    heroSubtitle: 'One starting point. More possibilities.',
    modules: [
      {
        icon: 'bookmark',
        title: 'Find Your Bookmarks',
        description: 'Search the pages you\'ve already saved.',
      },
      {
        icon: 'globe',
        title: 'Search the Web',
        description: 'Get to the information you need with less friction.',
      },
      {
        icon: 'sparkle',
        title: 'Jump Into AI',
        description: 'Take your prompt to your selected AI destination.',
      },
    ],
    tags: ['Bookmark Search', 'Web Search', 'AI Shortcuts'],
  },
  appearance: {
    heroTitle: 'Make It Yours',
    heroSubtitle: 'Your browser. Your space.',
    modules: [
      {
        icon: 'sparkle',
        title: 'A Beautiful Beginning',
        description: 'Enjoy a more personal new tab experience.',
      },
      {
        icon: 'settings',
        title: 'Set the Mood',
        description: 'Choose the appearance that feels right for you.',
      },
      {
        icon: 'folder',
        title: 'Designed for Everyday Use',
        description: 'A comfortable space you\'ll return to throughout the day.',
      },
    ],
    tags: ['Personal', 'Calm', 'Beautiful'],
    linksLabel: 'Policies',
    linksTone: 'quiet',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Use', to: '/terms' },
    ],
  },
  privacy: {
    heroTitle: 'Private by Design',
    heroSubtitle: 'Your bookmarks belong to you.',
    modules: [
      {
        icon: 'shield',
        title: 'Local-first',
        description: 'Your Chrome bookmarks are handled locally.',
      },
      {
        icon: 'bookmark',
        title: 'No Bookmark Uploads',
        description: 'Your bookmarks aren\'t uploaded to bytab servers.',
      },
      {
        icon: 'settings',
        title: 'You\'re in Control',
        description: 'Your browser and the third-party services you choose determine where your browsing actions go.',
      },
    ],
    tags: ['Local-first', 'No Bookmark Uploads', 'Your Choice'],
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
