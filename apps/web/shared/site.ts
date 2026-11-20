export type SiteIconName = 'bookmark' | 'dock' | 'search' | 'settings' | 'shield';

export interface SiteFeature {
  id: string;
  label: string;
  icon: SiteIconName;
  path: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
}

export const homepageSeo = {
  title: 'bytab — Liquid Glass New Tab & Chrome Bookmarks',
  description: 'Turn your Chrome bookmarks into a beautiful liquid glass new tab. Search saved pages, organize shortcuts, and open AI tools. Local-first, free, no account needed.',
};

export const chromeWebStoreListingUrl = 'https://chromewebstore.google.com/detail/gmgcnhgflkdegdabnipjpehidkpeacbd';

export const siteFeatures = [
  {
    id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark',
    path: '/features/chrome-bookmarks',
    title: 'Native Chrome Bookmarks',
    seoTitle: 'Chrome Bookmarks New Tab & Local Search | bytab',
    seoDescription: 'Browse and search your existing Chrome bookmarks from a beautiful new tab. No importing, no bookmark uploads, and no account needed.',
  },
  {
    id: 'dock', label: 'Dock', icon: 'dock',
    path: '/features/bookmark-dock',
    title: 'Bookmark Dock',
    seoTitle: 'Custom New Tab Shortcuts & Dock for Chrome | bytab',
    seoDescription: 'Keep your favorite websites within reach with customizable Chrome new tab shortcuts, folders, and a movable liquid glass dock.',
  },
  {
    id: 'search', label: 'Search', icon: 'search',
    path: '/features/search-launcher',
    title: 'Search & Quick Launch',
    seoTitle: 'AI Prompt Bar & Quick Search for Chrome | bytab',
    seoDescription: 'Launch ChatGPT, Claude, Grok, Gemini, Google, or Bing from your Chrome new tab. Send prompts directly to the service you choose.',
  },
  {
    id: 'appearance', label: 'Appearance', icon: 'settings',
    path: '/features/customize-new-tab',
    title: 'Personalize Your New Tab',
    seoTitle: 'Liquid Glass New Tab Themes & Wallpapers | bytab',
    seoDescription: 'Personalize your Chrome new tab with liquid glass styling, custom wallpapers, light and dark themes, and flexible dock positioning.',
  },
  {
    id: 'privacy', label: 'Privacy', icon: 'shield',
    path: '/features/privacy',
    title: 'Local-first Privacy',
    seoTitle: 'Private Chrome New Tab with Local Bookmarks | bytab',
    seoDescription: 'Your Chrome bookmarks, shortcuts, and wallpapers stay in your browser. No bookmark uploads, no account, and transparent third-party AI routing.',
  },
] as const satisfies readonly SiteFeature[];

export interface LegalDocument {
  id: string;
  path: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
}

export const legalDocuments = [
  {
    id: 'privacy-policy',
    path: '/privacy',
    title: 'Privacy Policy',
    seoTitle: 'Privacy Policy — Local-first Chrome Extension | bytab',
    seoDescription: 'Learn how bytab handles Chrome bookmarks, local storage, recent tabs, and prompts sent to third-party AI and search services.',
  },
  {
    id: 'terms',
    path: '/terms',
    title: 'Terms of Use',
    seoTitle: 'Terms of Use — bytab Chrome Extension',
    seoDescription: 'Read the terms of use for the bytab Chrome new tab extension and website, including permitted use and third-party services.',
  },
] as const satisfies readonly LegalDocument[];

export const supportPage = {
  path: '/support',
  title: 'Support',
  seoTitle: 'bytab Support & FAQ — Chrome New Tab Help',
  seoDescription: 'Get help with bytab for Chrome. Learn how to use bookmarks, local search, shortcuts, wallpapers, the Prompt Bar, and privacy settings.',
} as const;

export const sitePaths = [
  '/',
  ...siteFeatures.map(feature => feature.path),
  ...legalDocuments.map(document => document.path),
  supportPage.path,
];

export function findSiteFeature(path: string): SiteFeature | undefined {
  return siteFeatures.find(feature => feature.path === path.replace(/\/$/, ''));
}

export function resolveChromeWebStoreUrl(value: string): string | undefined {
  if (!value || !URL.canParse(value)) return;
  const url = new URL(value);
  if (url.origin !== 'https://chromewebstore.google.com' || url.username || url.password) return;
  if (!/^\/detail\/(?:[^/]+\/)?[a-p]{32}\/?$/.test(url.pathname)) return;
  return `${url.origin}${url.pathname}?utm_source=bytab.dev`;
}

export function resolveSiteOrigin(configuredUrl: string, requestOrigin: string): string {
  if (configuredUrl) {
    const url = new URL(configuredUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('NUXT_PUBLIC_SITE_URL must be an HTTP(S) URL.');
    }
    return url.origin;
  }
  return requestOrigin;
}
