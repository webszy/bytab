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
    description: 'Everything you\'ve saved. One beautiful place.',
    seoTitle: 'Your Bookmarks, Reimagined — bytab',
    seoDescription: 'See your existing Chrome bookmarks in one local new tab. Search saved pages without uploading bookmarks to bytab servers.',
  },
  {
    id: 'dock', label: 'Dock', icon: 'dock',
    path: '/features/bookmark-dock',
    title: 'Bookmark Dock',
    description: 'A simpler way to move through your day.',
    seoTitle: 'Everything Within Reach — bytab',
    seoDescription: 'A calmer dock for the places you use. Keep important destinations close in a clean Chrome new tab.',
  },
  {
    id: 'search', label: 'Search', icon: 'search',
    path: '/features/search-launcher',
    title: 'Search & Quick Launch',
    description: 'One starting point. More possibilities.',
    seoTitle: 'Search. Ask. Go. — bytab',
    seoDescription: 'Search saved bookmarks, open Google or Bing, or take a prompt to the AI destination you choose. bytab does not run the model.',
  },
  {
    id: 'appearance', label: 'Appearance', icon: 'settings',
    path: '/features/customize-new-tab',
    title: 'Personalize Your New Tab',
    description: 'Your browser. Your space.',
    seoTitle: 'Make It Yours — bytab',
    seoDescription: 'A personal Chrome new tab with light, dark, or system appearance, the default background or your own image, and a dock on any edge.',
  },
  {
    id: 'privacy', label: 'Privacy', icon: 'shield',
    path: '/features/privacy',
    title: 'Local-first Privacy',
    description: 'Your bookmarks belong to you.',
    seoTitle: 'Private by Design — bytab',
    seoDescription: 'Chrome bookmarks stay in your browser and are not uploaded to bytab. Prompts you submit go to the third-party service you choose.',
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
    seoTitle: 'Privacy Policy — bytab',
    seoDescription: 'How bytab version 0.0.1 handles Chrome bookmarks, local settings, prompts, Gemini site access, and bytab.dev technical logs.',
  },
  {
    id: 'terms',
    path: '/terms',
    title: 'Terms of Use',
    seoTitle: 'Terms of Use — bytab',
    seoDescription: 'Terms for the free bytab Chrome extension and bytab.dev, including third-party AI and search destinations. Version 0.0.1 does not charge a fee.',
  },
] as const satisfies readonly LegalDocument[];

export const sitePaths = [
  '/',
  ...siteFeatures.map(feature => feature.path),
  ...legalDocuments.map(document => document.path),
];

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
