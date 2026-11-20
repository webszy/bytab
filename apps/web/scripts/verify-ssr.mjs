import assert from 'node:assert/strict';
import { findFeatureContent } from '../shared/feature-content.ts';
import { chromeWebStoreListingUrl, homepageSeo, legalDocuments, resolveChromeWebStoreUrl, resolveSiteOrigin, siteFeatures, sitePaths, supportPage } from '../shared/site.ts';

// Run against a running Nuxt dev or production server; no browser or extra
// dependency is needed. An HTTP fetch verifies the actual server-rendered HTML.
const base = new URL(process.env.BYTAB_TEST_BASE_URL || 'http://localhost:3001');
const origin = resolveSiteOrigin(process.env.NUXT_PUBLIC_SITE_URL || '', base.origin);
const storeUrl = resolveChromeWebStoreUrl(process.env.NUXT_PUBLIC_CHROME_WEB_STORE_URL ?? chromeWebStoreListingUrl);
const tagline = 'Chrome for browsing. bytab for bookmarks.';
const introduction = 'A liquid glass new tab for the Chrome bookmarks you already have. Browse saved pages, search locally, organize your favorite shortcuts, and jump into your preferred AI or search tool.';
const privacyNote = 'Local-first · No bookmark uploads · No account needed';
const pages = [
  { path: '/', ...homepageSeo, heading: tagline, shell: true },
  ...siteFeatures.map(feature => {
    const sheet = findFeatureContent(feature.id);
    return {
      path: feature.path, title: feature.seoTitle, description: feature.seoDescription,
      windowTitle: feature.title, heading: sheet.heroTitle, shell: true, sheet,
    };
  }),
  ...legalDocuments.map(document => ({
    path: document.path, title: document.seoTitle, description: document.seoDescription, heading: document.title, legal: true,
  })),
  { path: supportPage.path, title: supportPage.seoTitle, description: supportPage.seoDescription, heading: supportPage.title, support: true },
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
  const matches = tags.filter(tag => attribute(tag, 'name') === key || attribute(tag, 'property') === key);
  assert.ok(matches.length <= 1, `At most one ${key} meta tag`);
  return matches.length ? attribute(matches[0], 'content') : undefined;
}

function canonicalUrl(html) {
  const links = (html.match(/<link\b[^>]*>/g) || []).filter(tag => attribute(tag, 'rel') === 'canonical');
  assert.equal(links.length, 1, 'Exactly one canonical link');
  return attribute(links[0], 'href');
}

assert.equal(new Set(pages.map(page => page.title)).size, pages.length, 'SEO titles must be unique');
assert.equal(new Set(pages.map(page => page.description)).size, pages.length, 'SEO descriptions must be unique');
const assets = new Set();
const socialImages = new Set();

for (const page of pages) {
  const response = await fetch(new URL(page.path, base), { redirect: 'error' });
  assert.equal(response.status, 200, `${page.path}: HTTP status`);
  const html = await response.text();
  const text = decode(html);
  for (const match of html.matchAll(/(?:href|src)="(\/_nuxt\/[^\"]*)"/g)) assets.add(match[1]);
  const titles = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map(match => decode(match[1]));
  assert.deepEqual(titles, [page.title], `${page.path}: exactly one SSR title`);
  const headings = [...html.matchAll(/<h1\b[^>]*>([^<]*)<\/h1>/g)].map(match => decode(match[1]));
  assert.deepEqual(headings, [page.heading], `${page.path}: exactly one SSR H1`);
  assert.equal(attribute(html.match(/<html\b[^>]*>/)?.[0] || '', 'lang'), 'en', `${page.path}: English document`);
  assert.equal(metadata(html, 'description'), page.description, `${page.path}: SSR description`);
  const canonical = new URL(page.path, origin).href;
  assert.equal(canonicalUrl(html), canonical, `${page.path}: SSR canonical`);
  assert.doesNotMatch([
    metadata(html, 'robots'), metadata(html, 'googlebot'), response.headers.get('x-robots-tag'),
  ].join(' '), /\b(?:noindex|none)\b/i, `${page.path}: indexable`);
  assert.equal(metadata(html, 'og:title'), page.title);
  assert.equal(metadata(html, 'og:description'), page.description);
  assert.equal(metadata(html, 'og:url'), canonical);
  assert.equal(metadata(html, 'og:type'), 'website');
  assert.equal(metadata(html, 'og:site_name'), 'bytab');
  const socialImage = metadata(html, 'og:image');
  assert.ok(socialImage, `${page.path}: has an OG image`);
  assert.equal(new URL(socialImage).origin, origin, `${page.path}: absolute OG image URL`);
  assert.equal(metadata(html, 'og:image:width'), '1200');
  assert.equal(metadata(html, 'og:image:height'), '630');
  socialImages.add(socialImage);
  assert.equal(metadata(html, 'twitter:card'), 'summary_large_image');
  assert.equal(metadata(html, 'twitter:title'), page.title);
  assert.equal(metadata(html, 'twitter:description'), page.description);
  assert.equal(metadata(html, 'twitter:image'), socialImage);
  const schema = [...html.matchAll(/<script\b(?=[^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)];
  if (page.path === '/') {
    assert.equal(schema.length, 1, 'One homepage JSON-LD graph');
    assert.deepEqual(JSON.parse(schema[0][1]), {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'bytab', url: canonical },
        {
          '@type': 'SoftwareApplication',
          name: 'bytab',
          url: canonical,
          applicationCategory: 'BrowserApplication',
          operatingSystem: 'Google Chrome',
          softwareVersion: '0.0.1',
          description: 'A liquid glass new tab for Chrome bookmarks, shortcuts, and quick AI and search access.',
          ...(storeUrl ? { downloadUrl: storeUrl } : {}),
          offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
        },
      ],
    });
  } else {
    assert.equal(schema.length, 0, `${page.path}: homepage schema is scoped to the homepage`);
  }
  assert.ok(!html.includes('home-brand-wordmark'), `${page.path}: no separate wordmark text`);
  if (page.shell) {
    for (const feature of siteFeatures) {
      assert.ok(html.includes(`href="${feature.path}"`), `${page.path}: crawlable ${feature.id} link`);
    }
    assert.ok(html.includes('class="home-brand-logo"') && html.includes('alt="bytab"'), `${page.path}: brand lockup`);
    assert.ok(!html.includes('class="home-brand-tagline"'), `${page.path}: logo tagline is hidden`);
    assert.ok(html.includes('>Settings<'), `${page.path}: settings button`);
    assert.ok(html.includes('class="home-time"') && html.includes('class="home-date"'), `${page.path}: clock and date`);
    assert.equal(text.split(tagline).length, 2, `${page.path}: one homepage tagline`);
    assert.ok(text.includes(introduction) && text.includes(privacyNote), `${page.path}: homepage introduction and privacy note`);
    assert.ok(!html.includes('class="home-recent"'), `${page.path}: recent page previews are removed`);
    assert.doesNotMatch(text, /Coming Soon/i, `${page.path}: no stale install copy`);
    const installLink = (html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || []).find(link => attribute(link.split('>')[0], 'class') === 'chrome-install');
    if (storeUrl) {
      assert.ok(installLink, `${page.path}: Add to Chrome link`);
      assert.match(installLink, />\s*Add to Chrome — Free\s*</, `${page.path}: install link copy`);
      const href = attribute(installLink, 'href');
      assert.equal(href, storeUrl, `${page.path}: official store listing`);
      assert.deepEqual(new URL(href).searchParams.getAll('utm_source'), ['bytab.dev'], `${page.path}: install attribution`);
      assert.equal(attribute(installLink, 'target'), '_blank');
      assert.deepEqual(attribute(installLink, 'rel').split(/\s+/).sort(), ['noopener', 'noreferrer']);
    } else {
      assert.equal(installLink, undefined, `${page.path}: no install link for an invalid store URL`);
    }
    assert.ok(html.includes('Ask anything...') && html.includes('aria-haspopup="dialog"') && text.includes('This website is a preview only.'));
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
    const label = [...html.matchAll(/(<p\b[^>]*>)([^<]*)<\/p>/g)].find(([, tag]) => attribute(tag, 'id') === titleId);
    assert.equal(decode(label?.[2]), page.windowTitle, `${page.path}: SSR dialog title`);
    assert.equal(attribute(dialog, 'aria-describedby'), 'feature-summary', `${page.path}: dialog describes its visible introduction`);
    const titlebar = html.match(/<header\b[^>]*class="window-titlebar"[^>]*>([\s\S]*?)<\/header>/)?.[1] || '';
    const titlebarActions = titlebar.match(/<(?:button|a)\b[^>]*>/g) || [];
    assert.equal(titlebarActions.length, 1, `${page.path}: one title bar action`);
    assert.equal(attribute(titlebarActions[0], 'aria-label'), 'Close window', `${page.path}: labelled close button`);
    assert.ok(!html.includes('feature-whiteboard'), `${page.path}: no empty whiteboard`);
    const sheet = decode(html.match(/<article\b[^>]*class="feature-sheet"[^>]*>([\s\S]*?)<\/article>/)?.[1]);
    assert.ok(sheet.includes(`<p id="feature-summary"`) && sheet.includes(page.sheet.heroSubtitle), `${page.path}: SSR feature introduction`);
    for (const module of page.sheet.modules) {
      assert.ok(sheet.includes(module.title) && sheet.includes(module.description), `${page.path}: SSR ${module.title} copy`);
    }
    for (const tag of page.sheet.tags) assert.ok(sheet.includes(tag), `${page.path}: tag ${tag}`);
    for (const link of page.sheet.links || []) {
      assert.ok(sheet.includes(`href="${link.to}"`) && sheet.includes(link.label), `${page.path}: crawlable ${link.label} link`);
    }
    const activeLink = (html.match(/<a\b[^>]*>/g) || []).find(tag => attribute(tag, 'href') === page.path && attribute(tag, 'id').startsWith('dock-'));
    assert.equal(attribute(activeLink || '', 'aria-current'), 'page', `${page.path}: active Dock`);
  } else if (page.legal) {
    assert.ok(!html.includes('role="dialog"'), `${page.path}: legal page is not a dialog`);
    assert.ok(!html.includes('bookmark-dock'), `${page.path}: legal page is not the homepage shell`);
    assert.ok(html.includes('<h1>'), `${page.path}: document heading`);
    assert.ok(html.includes('href="/"'), `${page.path}: return home`);
    assert.ok(html.includes('href="/support"'), `${page.path}: Support navigation`);
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
  } else if (page.support) {
    assert.ok(!html.includes('bookmark-dock'), 'Support is a standalone page');
    assert.match(html, /<h1\b[^>]*>Support<\/h1>/);
    for (const phrase of ['Getting Started', 'Frequently Asked Questions', 'Still need help?', 'Contact Support']) {
      assert.ok(text.includes(phrase), `Support includes ${phrase}`);
    }
    assert.ok(html.includes('href="mailto:szyszylife@gmail.com?subject=bytab%20Support%20%E2%80%94%20"'));
    assert.ok(html.includes('href="/privacy"') && html.includes('href="/terms"'), 'Support links to Privacy and Terms');
    if (storeUrl) assert.ok(html.includes(`href="${storeUrl}"`), 'Support links to the official store listing');
  } else {
    assert.ok(!html.includes('role="dialog"'), 'Homepage has no open dialog');
  }
  const panel = page.sheet ? ', feature sheet' : page.legal ? ', legal document' : '';
  console.log(`PASS ${page.path}: SSR, SEO, canonical${page.shell ? ', crawlable Dock' : ''}${panel}`);
}

assert.equal(socialImages.size, 1, 'All pages use the bytab share card');
const [socialImage] = [...socialImages].map(url => new URL(url));
const imageResponse = await fetch(new URL(socialImage.pathname + socialImage.search, base));
assert.equal(imageResponse.status, 200, 'OG image HTTP status');
assert.match(imageResponse.headers.get('content-type') ?? '', /^image\/png\b/);
const image = Buffer.from(await imageResponse.arrayBuffer());
assert.equal(image.toString('ascii', 12, 16), 'IHDR', 'OG image is a PNG');
assert.deepEqual([image.readUInt32BE(16), image.readUInt32BE(20)], [1200, 630], 'OG image dimensions');
console.log('PASS share card: 1200 × 630 PNG; homepage JSON-LD: WebSite and SoftwareApplication');

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
const sitemapResponse = await fetch(new URL('/sitemap.xml', base), { redirect: 'error' });
assert.equal(sitemapResponse.status, 200);
assert.match(sitemapResponse.headers.get('content-type') ?? '', /^application\/xml\b/);
const sitemap = await sitemapResponse.text();
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(locations, sitePaths.map(path => new URL(path, origin).href));
assert.doesNotMatch(sitemap, /<lastmod\b/);
const robotsResponse = await fetch(new URL('/robots.txt', base), { redirect: 'error' });
assert.equal(robotsResponse.status, 200);
assert.equal(await robotsResponse.text(), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
const queried = await (await fetch(new URL('/features/chrome-bookmarks?source=check#fragment', base))).text();
assert.equal(canonicalUrl(queried), `${origin}/features/chrome-bookmarks`, 'Canonical excludes query strings and fragments');
console.log(`PASS unknown routes: 404; sitemap: ${sitePaths.length} canonical URLs; robots: allows pages and declares the sitemap`);
