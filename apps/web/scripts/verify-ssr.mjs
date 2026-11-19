import assert from 'node:assert/strict';
import { homepageSeo, legalDocuments, resolveChromeWebStoreUrl, resolveSiteOrigin, siteFeatures, sitePaths } from '../shared/site.ts';

// Run against a running Nuxt dev or production server; no browser or extra
// dependency is needed. An HTTP fetch verifies the actual server-rendered HTML.
const base = new URL(process.env.BYTAB_TEST_BASE_URL || 'http://localhost:3001');
const origin = resolveSiteOrigin(process.env.NUXT_PUBLIC_SITE_URL || '', base.origin);
const featureSheets = {
  '/features/chrome-bookmarks': {
    hero: 'Your Bookmarks, Reimagined',
    modules: ['All Your Bookmarks', 'Find Things Faster', 'Local by Design'],
    tags: ['Chrome Native', 'Local-first', 'No Bookmark Uploads'],
  },
  '/features/bookmark-dock': {
    hero: 'Everything Within Reach',
    modules: ['Always Close', 'Less Clutter', 'Made for Your Flow'],
    tags: ['Simple', 'Accessible', 'Organized'],
  },
  '/features/search-launcher': {
    hero: 'Search. Ask. Go.',
    modules: ['Find Your Bookmarks', 'Search the Web', 'Jump Into AI'],
    tags: ['Bookmark Search', 'Web Search', 'AI Shortcuts'],
  },
  '/features/customize-new-tab': {
    hero: 'Make It Yours',
    modules: ['A Beautiful Beginning', 'Set the Mood', 'Designed for Everyday Use'],
    tags: ['Personal', 'Calm', 'Beautiful'],
    links: ['Privacy Policy', 'Terms of Use'],
  },
  '/features/privacy': {
    hero: 'Private by Design',
    modules: ['Local-first', 'No Bookmark Uploads', "You're in Control"],
    tags: ['Local-first', 'No Bookmark Uploads', 'Your Choice'],
    links: ['Read Privacy Policy', 'Read Terms of Use'],
  },
};
const pages = [
  { path: '/', title: homepageSeo.title, description: homepageSeo.description, shell: true },
  ...siteFeatures.map(feature => ({
    path: feature.path, title: feature.seoTitle, description: feature.seoDescription,
    windowTitle: feature.title, shell: true, sheet: featureSheets[feature.path],
  })),
  ...legalDocuments.map(document => ({
    path: document.path, title: document.seoTitle, description: document.seoDescription, legal: true,
  })),
];

function decode(value = '') {
  return value.replace(/&(amp|quot|apos|lt|gt|#39|#x27);/g, (_, entity) => ({
    amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', '#39': "'", '#x27': "'",
  })[entity]);
}

function attribute(tag, name) {
  return decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]);
}

function metadata(html, key) {
  const tags = html.match(/<meta\b[^>]*>/g) || [];
  const tag = tags.find(value => attribute(value, 'name') === key || attribute(value, 'property') === key);
  return tag ? attribute(tag, 'content') : undefined;
}

assert.equal(new Set(pages.map(page => page.title)).size, pages.length, 'SEO titles must be unique');
assert.equal(new Set(pages.map(page => page.description)).size, pages.length, 'SEO descriptions must be unique');
const assets = new Set();

for (const page of pages) {
  const response = await fetch(new URL(page.path, base));
  assert.equal(response.status, 200, `${page.path}: HTTP status`);
  const html = await response.text();
  const text = decode(html);
  for (const match of html.matchAll(/(?:href|src)="(\/_nuxt\/[^\"]*)"/g)) assets.add(match[1]);
  assert.equal(decode(html.match(/<title>([^<]*)<\/title>/)?.[1]), page.title, `${page.path}: SSR title`);
  assert.equal(metadata(html, 'description'), page.description, `${page.path}: SSR description`);
  assert.equal(metadata(html, 'og:title'), page.title);
  assert.equal(metadata(html, 'og:description'), page.description);
  assert.equal(metadata(html, 'og:url'), new URL(page.path, origin).href);
  assert.equal(metadata(html, 'twitter:card'), 'summary');
  assert.equal(metadata(html, 'twitter:title'), page.title);
  assert.equal(metadata(html, 'twitter:description'), page.description);
  const canonical = (html.match(/<link\b[^>]*>/g) || []).filter(tag => attribute(tag, 'rel') === 'canonical');
  assert.equal(canonical.length, 1, `${page.path}: exactly one canonical`);
  assert.equal(attribute(canonical[0], 'href'), new URL(page.path, origin).href);
  assert.ok(!html.includes('home-brand-wordmark'), `${page.path}: no separate wordmark text`);
  if (page.shell) {
    for (const feature of siteFeatures) {
      assert.ok(html.includes(`href="${feature.path}"`), `${page.path}: crawlable ${feature.id} link`);
    }
    assert.ok(html.includes('class="home-brand-logo"') && html.includes('alt="bytab"'), `${page.path}: brand lockup`);
    assert.ok(!html.includes('class="home-brand-tagline"'), `${page.path}: logo tagline is hidden`);
    assert.ok(html.includes('>Settings<'), `${page.path}: settings button`);
    assert.ok(html.includes('class="home-time"') && html.includes('class="home-date"'), `${page.path}: clock and date`);
    assert.ok(html.includes('Start your day. Start with bytab.'), `${page.path}: homepage tagline`);
    assert.ok(!html.includes('class="home-recent"'), `${page.path}: recent page previews are removed`);
    const installLink = (html.match(/<a\b[^>]*>/g) || []).find(tag => attribute(tag, 'class') === 'chrome-install');
    if (installLink) {
      const href = attribute(installLink, 'href');
      assert.ok(href && resolveChromeWebStoreUrl(href) === href, `${page.path}: official store listing`);
      assert.equal(attribute(installLink, 'target'), '_blank');
    } else {
      assert.match(html, /<button\b(?=[^>]*class="chrome-install")(?=[^>]*\bdisabled)[^>]*>Coming Soon<\/button>/);
    }
    assert.ok(html.includes('Ask anything...') && html.includes('role="tooltip"') && text.includes('This website is a preview only.'));
    assert.ok(!html.includes('id="home-prompt-input"') && !html.includes('aria-label="Select provider"'));
    assert.ok(html.includes('Frequent Shortcuts') && html.includes('Reset layout'), `${page.path}: extension shortcut bar`);
    const privacyDock = (html.match(/<a\b[^>]*>/g) || []).find(tag => attribute(tag, 'id') === 'dock-privacy');
    assert.equal(attribute(privacyDock || '', 'href'), '/features/privacy', `${page.path}: privacy Dock opens the intro`);
  }
  if (page.windowTitle) {
    const dialog = html.match(/<[^>]+\brole="dialog"[^>]*>/)?.[0];
    assert.ok(dialog, `${page.path}: SSR dialog`);
    const titleId = attribute(dialog, 'aria-labelledby');
    assert.ok(titleId, `${page.path}: dialog is labelled`);
    const heading = [...html.matchAll(/(<h2\b[^>]*>)([^<]*)<\/h2>/g)].find(([, tag]) => attribute(tag, 'id') === titleId);
    assert.equal(decode(heading?.[2]), page.windowTitle, `${page.path}: SSR dialog title`);
    const titlebar = html.match(/<header\b[^>]*class="window-titlebar"[^>]*>([\s\S]*?)<\/header>/)?.[1] || '';
    const titlebarActions = titlebar.match(/<(?:button|a)\b[^>]*>/g) || [];
    assert.equal(titlebarActions.length, 1, `${page.path}: one title bar action`);
    assert.equal(attribute(titlebarActions[0], 'aria-label'), 'Close window', `${page.path}: labelled close button`);
    assert.ok(!html.includes('feature-whiteboard'), `${page.path}: no empty whiteboard`);
    assert.ok(text.includes(page.sheet.hero), `${page.path}: hero`);
    for (const moduleTitle of page.sheet.modules) assert.ok(text.includes(moduleTitle), `${page.path}: ${moduleTitle}`);
    for (const tag of page.sheet.tags) assert.ok(text.includes(tag), `${page.path}: tag ${tag}`);
    for (const label of page.sheet.links || []) assert.ok(text.includes(label), `${page.path}: link ${label}`);
    if (page.path === '/features/privacy' || page.path === '/features/customize-new-tab') {
      assert.ok(html.includes('href="/privacy"') && html.includes('href="/terms"'), `${page.path}: legal links leave the window`);
    }
    const activeLink = (html.match(/<a\b[^>]*>/g) || []).find(tag => attribute(tag, 'href') === page.path && attribute(tag, 'id').startsWith('dock-'));
    assert.equal(attribute(activeLink || '', 'aria-current'), 'page', `${page.path}: active Dock`);
  } else if (page.legal) {
    assert.ok(!html.includes('role="dialog"'), `${page.path}: legal page is not a dialog`);
    assert.ok(!html.includes('bookmark-dock'), `${page.path}: legal page is not the homepage shell`);
    assert.ok(html.includes('<h1>'), `${page.path}: document heading`);
    assert.ok(html.includes('href="/"'), `${page.path}: return home`);
    assert.ok(!text.includes('not yet confirmed') && !text.includes('not published in this version'));
    assert.ok(html.includes('datetime="2026-11-19"') && text.includes('Last updated'));
    assert.ok(text.includes('SUN ZHENYU') && html.includes('href="mailto:szyszylife@gmail.com"'));
    for (const invented of ['privacy@', 'support@', 'Bytab Inc', 'Bytab, Inc', 'LLC', 'Ltd.', 'TODO', 'lorem', '[Company', 'Delaware']) {
      assert.ok(!text.includes(invented), `${page.path}: no invented detail ${invented}`);
    }
    const required = page.path === '/privacy'
      ? ['Introduction', 'Information We Access', 'How We Use Information', 'Chrome Permissions', 'Local Storage and Data Retention', 'Third-Party AI and Search Services', 'Data Sharing and Transfers', 'Website Analytics and Technical Logs', 'Data Security', 'User Choices and Data Deletion', "Children's Privacy", 'Chrome Web Store User Data Policy', 'Changes to This Policy', 'Contact Information', 'Limited Use', 'gemini.google.com', 'not uploaded', 'chrome.storage.local', 'Cloudflare']
      : ['Acceptance of Terms', 'Description of Service', 'Eligibility and Permitted Use', 'User Responsibilities', 'Third-Party Services and Websites', 'Intellectual Property', 'Availability and Changes', 'Disclaimers', 'Limitation of Liability', 'Termination', 'Updates to Terms', 'Contact Information', 'free to use'];
    for (const phrase of required) assert.ok(text.includes(phrase), `${page.path}: ${phrase}`);
  } else {
    assert.ok(!html.includes('role="dialog"'), 'Homepage has no open dialog');
  }
  const panel = page.sheet ? ', feature sheet' : page.legal ? ', legal document' : '';
  console.log(`PASS ${page.path}: SSR, SEO, canonical${page.shell ? ', crawlable Dock' : ''}${panel}`);
}

for (const path of assets) {
  assert.notEqual(path, '/_nuxt/', 'Asset references must name a file');
  const url = new URL(path, base);
  const response = await fetch(url);
  assert.equal(response.status, 200, `${path}: static asset is served`);
  if (response.headers.get('content-type')?.includes('text/css')) {
    const css = await response.text();
    for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      const assetUrl = new URL(match[1], url);
      if (assetUrl.origin === base.origin) assets.add(assetUrl.pathname);
    }
  }
}
console.log(`PASS ${assets.size} static resources: scripts, styles, local fonts and wallpaper`);

for (const path of ['/features/unknown-feature', '/features/chrome-bookmarks/extra', '/unknown-page']) {
  assert.equal((await fetch(new URL(path, base))).status, 404, `${path}: genuine 404`);
}
const sitemap = await (await fetch(new URL('/sitemap.xml', base))).text();
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(locations, sitePaths.map(path => new URL(path, origin).href));
const robots = await (await fetch(new URL('/robots.txt', base))).text();
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const queried = await (await fetch(new URL('/features/chrome-bookmarks?source=check', base))).text();
assert.equal(metadata(queried, 'og:url'), `${origin}/features/chrome-bookmarks`, 'Canonical excludes query strings');
console.log(`PASS unknown routes: 404; sitemap: all ${sitePaths.length} pages; robots: sitemap discovery; canonical: no query`);
