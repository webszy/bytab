import assert from 'node:assert/strict';
import { homepageSeo, resolveSiteOrigin, siteFeatures, sitePaths } from '../shared/site.ts';

// Run against a running Nuxt dev or production server; no browser or extra
// dependency is needed. An HTTP fetch verifies the actual server-rendered HTML.
const base = new URL(process.env.BYTAB_TEST_BASE_URL || 'http://localhost:3001');
const origin = resolveSiteOrigin(process.env.NUXT_PUBLIC_SITE_URL || '', base.origin);
const pages = [
  { path: '/', title: homepageSeo.title, description: homepageSeo.description },
  ...siteFeatures.map(feature => ({
    path: feature.path, title: feature.seoTitle, description: feature.seoDescription,
    windowTitle: feature.title,
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
  for (const feature of siteFeatures) {
    assert.ok(html.includes(`href="${feature.path}"`), `${page.path}: crawlable ${feature.id} link`);
  }
  assert.ok(html.includes('Chrome for browsing.') && html.includes('bytab for bookmarks.'), 'SSR homepage shell');
  if (page.windowTitle) {
    assert.ok(html.includes('role="dialog"'), `${page.path}: SSR dialog`);
    assert.equal(decode(html.match(/<h2 id="feature-window-title">([^<]*)<\/h2>/)?.[1]), page.windowTitle);
    assert.ok(html.includes('<div class="feature-whiteboard"></div>'), `${page.path}: empty SSR whiteboard`);
    const activeLink = (html.match(/<a\b[^>]*>/g) || []).find(tag => attribute(tag, 'href') === page.path && attribute(tag, 'id').startsWith('dock-'));
    assert.equal(attribute(activeLink || '', 'aria-current'), 'page', `${page.path}: active Dock`);
  } else {
    assert.ok(!html.includes('role="dialog"'), 'Homepage has no open dialog');
  }
  console.log(`PASS ${page.path}: SSR, SEO, canonical, crawlable Dock${page.windowTitle ? ', empty modal' : ''}`);
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
console.log('PASS unknown routes: 404; sitemap: all 6 pages; robots: sitemap discovery; canonical: no query');
