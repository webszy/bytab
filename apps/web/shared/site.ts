export type SiteIconName = 'bookmark' | 'dock' | 'search' | 'settings' | 'shield';

export interface SiteFeature {
  id: string;
  label: string;
  icon: SiteIconName;
  path: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

export const homepageSeo = {
  title: 'bytab — A Beautiful, Private Chrome New Tab',
  description: 'A beautiful, privacy-friendly new tab for Chrome. Keep your bookmarks and favorite websites within easy reach. Local-first · No bookmark uploads.',
};

export const siteFeatures = [
  {
    id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark',
    path: '/features/chrome-bookmarks',
    title: 'Native Chrome Bookmarks',
    description: 'Your existing Chrome bookmarks, beautifully at home in your new tab.',
    seoTitle: 'Native Chrome Bookmarks — bytab',
    seoDescription: 'Give your existing Chrome bookmarks a beautiful new home with bytab. Access them directly in your new tab, with local processing and no bookmark uploads.',
  },
  {
    id: 'dock', label: 'Dock', icon: 'dock',
    path: '/features/bookmark-dock',
    title: 'Bookmark Dock',
    description: 'Keep your bookmarks and favorite websites within easy reach.',
    seoTitle: 'Bookmark Dock for Your Chrome New Tab — bytab',
    seoDescription: 'Keep your favorite websites close with the bytab Bookmark Dock. A beautiful, familiar way to access Chrome bookmarks from your new tab.',
  },
  {
    id: 'search', label: 'Search', icon: 'search',
    path: '/features/search-launcher',
    title: 'Search & Quick Launch',
    description: 'A central place to find your bookmarks and reach your favorite websites.',
    seoTitle: 'Search & Quick Launch for Chrome — bytab',
    seoDescription: 'Explore bytab Search & Quick Launch: a central place for finding your Chrome bookmarks and reaching favorite websites in your personal new tab.',
  },
  {
    id: 'appearance', label: 'Appearance', icon: 'settings',
    path: '/features/customize-new-tab',
    title: 'Personalize Your New Tab',
    description: 'Make your bookmark-centered personal space feel like your own.',
    seoTitle: 'Customize Your Chrome New Tab — bytab',
    seoDescription: 'Make your Chrome new tab feel like home with bytab. Discover a beautiful, personal space centered on your bookmarks and favorite websites.',
  },
  {
    id: 'privacy', label: 'Privacy', icon: 'shield',
    path: '/privacy',
    title: 'Local-first Privacy',
    description: 'bytab displays your existing Chrome bookmarks locally and never uploads them to its own servers. Chrome bookmark sync follows your Chrome settings.',
    seoTitle: 'Local-first Privacy · No Bookmark Uploads — bytab',
    seoDescription: 'bytab processes and displays your existing Chrome bookmarks locally, without uploading them to bytab servers. Chrome bookmark sync follows your Chrome settings.',
  },
] as const satisfies readonly SiteFeature[];

export const sitePaths = ['/', ...siteFeatures.map(feature => feature.path)];

export function findSiteFeature(path: string): SiteFeature | undefined {
  return siteFeatures.find(feature => feature.path === path.replace(/\/$/, ''));
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
