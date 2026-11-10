import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Use an existing Playwright installation; no runtime or extension dependency.
const { chromium } = await import(process.env.BYTAB_PLAYWRIGHT_MODULE || 'playwright');
const extension = fileURLToPath(new URL('../.output/chrome-mv3', import.meta.url));
const output = fileURLToPath(new URL('../.output/bookmark-verification', import.meta.url));
const profile = await mkdtemp(path.join(os.tmpdir(), 'bytab-bookmarks-'));
await mkdir(output, { recursive: true });
const executablePath = process.env.BYTAB_CHROMIUM_EXECUTABLE;
const context = await chromium.launchPersistentContext(profile, {
  ...(executablePath ? { executablePath } : { channel: 'chromium' }),
  headless: true,
  ignoreDefaultArgs: ['--disable-extensions'],
  viewport: { width: 1440, height: 900 },
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
const checks = [];
const errors = [];
const requests = [];
const record = (name, details) => { checks.push({ name, ...details }); console.log(`PASS ${name}`); };
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
await context.route(/^https?:\/\//, route => {
  requests.push(route.request().url());
  return route.fulfill({ contentType: 'text/html', body: '<title>Bookmark test destination</title>Bookmark opened' });
});

try {
  const page = await context.newPage();
  await page.goto('chrome://newtab/');
  await page.locator('.dock-count').filter({ hasText: /^0$/ }).waitFor();
  const extensionUrl = page.url();
  const panel = page.locator('.bookmark-panel');
  const heading = panel.locator('h2');
  const search = panel.getByRole('combobox', { name: 'Search all bookmarks' });
  const rootButton = page.locator('.dock-root');
  const category = title => page.locator('.dock-navigation button').filter({ has: page.locator(`.dock-folder-label`, { hasText: new RegExp(`^${title}$`) }) });
  const countIs = async count => page.waitForFunction(value => document.querySelector('.dock-count')?.textContent === String(value), count);
  const titleIs = async title => page.waitForFunction(value => document.querySelector('.bookmark-panel h2')?.textContent === value, title);
  const resultsAre = async count => page.waitForFunction(value => document.querySelectorAll('#bookmark-results .bookmark-entry').length === value, count);
  const tick = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

  await rootButton.click();
  await panel.getByText('No bookmarks yet', { exact: true }).waitFor();
  await rootButton.click();
  assert.equal(await panel.count(), 0);
  record('empty Chrome library and repeated-category close');

  const fixture = await page.evaluate(async () => {
    const root = (await chrome.bookmarks.getTree())[0];
    const native = root.children.filter(node => node.url === undefined && !node.unmodifiable);
    const bar = native[0];
    const other = native[1] || native[0];
    const folders = [];
    const links = [];
    for (let index = 0; index < 20; index++) {
      const folder = await chrome.bookmarks.create({ parentId: bar.id, title: index === 0 ? 'Development' : `Folder ${String(index).padStart(2, '0')}` });
      folders.push(folder);
      for (let child = 0; child < 25; child++) {
        links.push(await chrome.bookmarks.create({ parentId: folder.id, title: child === 0 && index < 2 ? 'Shared Docs' : `Bookmark ${index * 25 + child}`, url: `https://bookmarks.example.test/folder-${index}/item-${child}` }));
      }
    }
    const frontend = await chrome.bookmarks.create({ parentId: folders[0].id, title: 'Frontend' });
    const vue = await chrome.bookmarks.create({ parentId: frontend.id, title: 'Vue' });
    await chrome.bookmarks.create({ parentId: vue.id, title: 'Vue Docs', url: 'https://vuejs.org/guide/' });
    await chrome.bookmarks.create({ parentId: vue.id, title: 'Nuxt Docs', url: 'https://nuxt.com/docs' });
    const empty = await chrome.bookmarks.create({ parentId: bar.id, title: 'Empty folder' });
    await chrome.bookmarks.create({ parentId: bar.id, title: 'Loose root bookmark', url: 'https://loose.example.test/' });
    await chrome.bookmarks.create({ parentId: other.id, title: 'Outside Folder Docs', url: 'https://outside.example.test/docs' });
    await chrome.bookmarks.create({ parentId: folders[0].id, title: 'Unsafe bookmark', url: 'javascript:window.__bytabUnsafeExecuted=true' });
    await chrome.bookmarks.create({ parentId: folders[0].id, title: 'Unsafe data bookmark', url: 'data:text/html,<script>alert(1)</script>' });
    await chrome.bookmarks.create({ parentId: folders[0].id, title: 'A'.repeat(240), url: 'https://long-title.example.test/' });
    const permission = await chrome.permissions.getAll();
    return { bar, other, folders, links, frontend, vue, empty, permission, count: 507 };
  });
  await countIs(fixture.count);
  const manifestPermissions = await page.evaluate(() => chrome.runtime.getManifest().permissions);
  assert.deepEqual(manifestPermissions.sort(), ['bookmarks', 'sessions', 'storage']);
  // Recent Chromium versions also report the implicit New Tab override grant.
  assert.ok(fixture.permission.permissions.every(permission => manifestPermissions.includes(permission) || permission === 'newTabPageOverride'));
  await category('Development').waitFor();
  record('507 real Chrome bookmarks, native ordering and unchanged permissions');

  await rootButton.click();
  await panel.getByRole('button', { name: new RegExp(`^${fixture.bar.title}`) }).click();
  await panel.getByRole('button', { name: /^Loose root bookmark/ }).waitFor();
  await panel.getByRole('navigation', { name: 'Bookmark path' }).getByRole('button', { name: 'All Bookmarks', exact: true }).click();
  await panel.getByRole('button', { name: new RegExp(`^${fixture.other.title}`) }).click();
  await panel.getByRole('button', { name: /^Outside Folder Docs/ }).waitFor();
  record('All Bookmarks reaches native roots and loose bookmarks without duplication');

  await category('Development').click();
  for (const [width, height] of [[1280, 720], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await tick();
    const bounds = await page.evaluate(() => {
      const rect = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      };
      const nav = document.querySelector('.dock-navigation');
      return {
        panel: rect('.bookmark-panel'), dock: rect('.bookmark-dock'), search: rect('.bookmark-search'),
        grid: rect('.bookmark-entries'), topbar: rect('.home-topbar'),
        navigation: { client: nav.clientWidth, scroll: nav.scrollWidth },
        pageWidth: document.documentElement.scrollWidth,
        buttons: [...document.querySelectorAll('.dock-content button')].map(button => {
          const r = button.getBoundingClientRect(); return { left: r.left, right: r.right };
        }),
      };
    });
    assert.ok(bounds.panel.top >= bounds.topbar.bottom + 8, JSON.stringify(bounds));
    assert.ok(bounds.panel.bottom <= bounds.dock.top - 8);
    assert.ok(bounds.panel.left >= 0 && bounds.panel.right <= width);
    assert.ok(bounds.search.bottom <= bounds.grid.top);
    assert.ok(bounds.navigation.scroll <= bounds.navigation.client + 1);
    assert.ok(bounds.buttons.every(button => button.left >= 0 && button.right <= width));
    assert.ok(bounds.pageWidth <= width);
    await page.screenshot({ path: path.join(output, `bookmarks-${width}x${height}.png`) });
    record(`layout ${width} × ${height}`, { bounds });
  }
  const visibleCounts = [];
  for (const width of [1024, 800, 620, 400, 320]) {
    await page.setViewportSize({ width, height: 720 });
    await tick();
    const bounds = await page.evaluate(() => {
      const navigation = document.querySelector('.dock-navigation');
      return {
        pageWidth: document.documentElement.scrollWidth,
        overflow: navigation.scrollWidth - navigation.clientWidth,
        buttons: [...document.querySelectorAll('.dock-content button')].map(button => ({ left: button.getBoundingClientRect().left, right: button.getBoundingClientRect().right })),
      };
    });
    assert.ok(bounds.pageWidth <= width);
    assert.ok(bounds.overflow <= 1, `${width}: ${JSON.stringify(bounds)}`);
    assert.ok(bounds.buttons.every(button => button.left >= 0 && button.right <= width), `${width}: ${JSON.stringify(bounds)}`);
    await page.locator('.dock-folder--more').waitFor();
    visibleCounts.push(await page.locator('.dock-navigation button:not(.dock-folder--more)').count());
  }
  assert.ok(visibleCounts[0] > visibleCounts.at(-1));
  record('narrow windows resize visible categories through 320px without Dock overflow', { visibleCounts });
  await page.setViewportSize({ width: 1440, height: 900 });
  await tick();
  await page.locator('.dock-folder--more').click();
  await titleIs('More folders');
  const moreCount = Number((await page.locator('.dock-folder--more').textContent()).match(/\((\d+)\)/)[1]);
  assert.equal(await panel.locator('.bookmark-entry--folder').count(), moreCount);
  await panel.getByRole('button', { name: /^Empty folder/ }).click();
  await panel.getByText('This folder is empty', { exact: true }).waitFor();
  await category('Development').click();
  await panel.getByRole('button', { name: /^Frontend/ }).click();
  await panel.getByRole('button', { name: /^Vue/ }).click();
  await titleIs('Vue');
  assert.match(await panel.locator('.bookmark-breadcrumb').textContent(), /All Bookmarks.*Development.*Frontend.*Vue/s);
  await panel.getByRole('navigation', { name: 'Bookmark path' }).getByRole('button', { name: 'Development', exact: true }).click();
  await titleIs('Development');
  await panel.getByRole('button', { name: /^Frontend/ }).click();
  await panel.getByRole('button', { name: /^Vue/ }).click();
  assert.equal((await page.evaluate(() => chrome.storage.local.get('bytab.lastOpened')))['bytab.lastOpened'], undefined);
  record('responsive More, empty folders, nested navigation, breadcrumbs, no folder history writes');

  await search.fill('  OUTSIDE.EXAMPLE.TEST  ');
  await resultsAre(1);
  assert.match(await panel.locator('.bookmark-entry-path').textContent(), new RegExp(fixture.other.title));
  await search.fill('Shared Docs');
  await resultsAre(2);
  assert.match(await panel.locator('.bookmark-entry').first().getAttribute('title'), /folder-0\/item-0/);
  assert.equal(requests.length, 0);
  await search.press('ArrowDown');
  assert.equal(await panel.locator('[aria-selected="true"]').getAttribute('title'), await panel.locator('.bookmark-entry').nth(1).getAttribute('title'));
  const openedPromise = context.waitForEvent('page');
  await search.press('Enter');
  const opened = await openedPromise;
  await opened.waitForURL(fixture.links[25].url);
  const lastOpened = (await page.evaluate(() => chrome.storage.local.get('bytab.lastOpened')))['bytab.lastOpened'];
  assert.equal(lastOpened.url, fixture.links[25].url);
  assert.equal(lastOpened.title, 'Shared Docs');
  assert.ok(Date.now() - lastOpened.openedAt < 10000);
  await opened.close();
  await search.fill('Unsafe bookmark');
  await resultsAre(1);
  const pagesBefore = context.pages().length;
  await panel.locator('.bookmark-entry').click();
  await panel.getByText('This bookmark has an unsupported or invalid URL.', { exact: true }).waitFor();
  assert.equal(context.pages().length, pagesBefore);
  assert.equal(await page.evaluate(() => window.__bytabUnsafeExecuted), undefined);
  assert.deepEqual((await page.evaluate(() => chrome.storage.local.get('bytab.lastOpened')))['bytab.lastOpened'], lastOpened);
  await search.fill('Unsafe data bookmark');
  await resultsAre(1);
  await panel.locator('.bookmark-entry').click();
  await panel.getByText('This bookmark has an unsupported or invalid URL.', { exact: true }).waitFor();
  assert.equal(context.pages().length, pagesBefore);
  record('global title/domain/URL search, stable results, keyboard open, Last Opened and unsafe URL rejection');

  await search.fill('no-match-at-all');
  await panel.getByText('No matching bookmarks', { exact: true }).waitFor();
  await search.press('Escape');
  assert.equal(await search.inputValue(), '');
  await titleIs('Vue');
  await search.press('Escape');
  assert.equal(await panel.count(), 0);
  await page.locator('.dock-filter').click();
  await search.fill('Bookmark');
  const searchTime = await page.evaluate(async () => {
    const input = document.querySelector('.bookmark-search');
    const start = performance.now();
    input.value = 'bookmarks.example.test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return performance.now() - start;
  });
  await resultsAre(100);
  assert.match(await panel.locator('.bookmark-result-status').textContent(), /^500 results/);
  // Jump across the render batch boundary with the keyboard, then grow on scroll.
  await search.press('ArrowUp');
  await page.waitForFunction(() => document.querySelectorAll('#bookmark-results .bookmark-entry').length === 500);
  assert.ok(searchTime < 250, `Search update took ${searchTime}ms`);
  await page.screenshot({ path: path.join(output, 'global-search.png') });
  await page.locator('.prompt-input').focus();
  await page.locator('.prompt-input').fill('Keep this prompt');
  await page.locator('.prompt-input').press('Escape');
  assert.equal(await panel.count(), 1);
  assert.equal(await search.inputValue(), 'bookmarks.example.test');
  assert.equal(await page.locator('.prompt-input').inputValue(), 'Keep this prompt');
  await page.locator('.home-time').click();
  assert.equal(await panel.count(), 0);
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await panel.locator('.bookmark-entries--list').waitFor();
  await page.getByRole('button', { name: 'Grid view', exact: true }).click();
  await panel.locator('.bookmark-entries--grid').waitFor();
  record('search empty state, Esc priority, batched 500-result rendering, Prompt isolation and view controls', { searchTimeMs: searchTime });

  await category('Development').click();
  await panel.getByRole('button', { name: /^Frontend/ }).click();
  await panel.getByRole('button', { name: /^Vue/ }).click();
  await page.evaluate(id => chrome.bookmarks.update(id, { title: 'Development renamed' }), fixture.folders[0].id);
  await category('Development renamed').waitFor();
  await page.waitForFunction(() => document.querySelector('.bookmark-breadcrumb').textContent.includes('Development renamed'));
  await page.evaluate(({ id, parentId }) => chrome.bookmarks.move(id, { parentId }), { id: fixture.vue.id, parentId: fixture.folders[2].id });
  await page.waitForFunction(() => document.querySelector('.bookmark-breadcrumb').textContent.includes('Folder 02'));
  assert.doesNotMatch(await panel.locator('.bookmark-breadcrumb').textContent(), /Frontend/);
  const created = await page.evaluate(parentId => chrome.bookmarks.create({ parentId, title: 'Sync created', url: 'https://sync.example.test/new' }), fixture.vue.id);
  await countIs(fixture.count + 1);
  await panel.getByRole('button', { name: /^Sync created/ }).waitFor();
  await search.fill('Sync created');
  await resultsAre(1);
  await page.evaluate(id => chrome.bookmarks.update(id, { title: 'Sync renamed' }), created.id);
  await panel.getByText('No matching bookmarks', { exact: true }).waitFor();
  await search.fill('Sync renamed');
  await resultsAre(1);
  await page.evaluate(({ id, parentId }) => chrome.bookmarks.move(id, { parentId }), { id: created.id, parentId: fixture.folders[3].id });
  await page.waitForFunction(() => document.querySelector('.bookmark-entry-path')?.textContent.includes('Folder 03'));
  await page.evaluate(id => chrome.bookmarks.remove(id), created.id);
  await countIs(fixture.count);
  await panel.getByText('No matching bookmarks', { exact: true }).waitFor();
  await search.fill('');
  await page.evaluate(id => chrome.bookmarks.removeTree(id), fixture.vue.id);
  await titleIs('Folder 02');
  await countIs(fixture.count - 2);
  record('native create/change/move/remove events, index updates, moved breadcrumbs and surviving-parent recovery');

  const second = await context.newPage();
  await second.goto(extensionUrl);
  await second.waitForFunction(expected => document.querySelector('.dock-count')?.textContent === String(expected), fixture.count - 2);
  const secondCreated = await page.evaluate(parentId => chrome.bookmarks.create({ parentId, title: 'Across tabs', url: 'https://across-tabs.example.test/' }), fixture.folders[1].id);
  await countIs(fixture.count - 1);
  await second.waitForFunction(expected => document.querySelector('.dock-count')?.textContent === String(expected), fixture.count - 1);
  await page.evaluate(id => chrome.bookmarks.remove(id), secondCreated.id);
  await countIs(fixture.count - 2);
  await second.close();
  record('multiple extension tabs synchronize without persisted bookmark copies');

  const probe = await context.newPage();
  await probe.addInitScript(() => {
    const state = window.__bookmarkProbe = { calls: 0, listeners: {}, fire: name => { for (const listener of state.listeners[name]) listener(); } };
    const nativeGetTree = chrome.bookmarks.getTree.bind(chrome.bookmarks);
    chrome.bookmarks.getTree = async () => {
      state.calls++;
      if (state.calls === 1) { await new Promise(resolve => setTimeout(resolve, 800)); throw new Error('Test read failure'); }
      return nativeGetTree();
    };
    for (const name of ['onCreated', 'onRemoved', 'onChanged', 'onMoved', 'onChildrenReordered', 'onImportEnded']) {
      const listeners = state.listeners[name] = new Set();
      const event = chrome.bookmarks[name];
      const add = event.addListener.bind(event);
      const remove = event.removeListener.bind(event);
      event.addListener = listener => { listeners.add(listener); add(listener); };
      event.removeListener = listener => { listeners.delete(listener); remove(listener); };
    }
  });
  await probe.goto(extensionUrl);
  await probe.locator('.dock-root').click();
  await probe.getByText('Loading bookmarks…', { exact: true }).waitFor();
  await probe.getByText('Could not load bookmarks. Try again.', { exact: false }).waitFor();
  assert.equal(await probe.getByText('No bookmarks yet', { exact: true }).count(), 0);
  await probe.getByRole('button', { name: 'Retry', exact: true }).click();
  await probe.waitForFunction(expected => document.querySelector('.dock-count')?.textContent === String(expected), fixture.count - 2);
  const callsBeforeSearch = await probe.evaluate(() => window.__bookmarkProbe.calls);
  await probe.getByRole('combobox').fill('Bookmark');
  await probe.getByRole('combobox').fill('example.test');
  await probe.getByRole('combobox').fill('no-match');
  assert.equal(await probe.evaluate(() => window.__bookmarkProbe.calls), callsBeforeSearch);
  await probe.evaluate(() => {
    window.__bookmarkProbe.fire('onChildrenReordered');
    window.__bookmarkProbe.fire('onImportEnded');
    window.__bookmarkProbe.fire('onCreated');
  });
  await probe.waitForFunction(previous => window.__bookmarkProbe.calls === previous + 1, callsBeforeSearch);
  assert.deepEqual(await probe.evaluate(() => Object.values(window.__bookmarkProbe.listeners).map(listeners => listeners.size)), [1, 1, 1, 1, 1, 1]);
  await probe.evaluate(() => {
    window.__bookmarkProbe.fire('onChanged');
    document.querySelector('#app').__vue_app__.unmount();
  });
  assert.deepEqual(await probe.evaluate(() => Object.values(window.__bookmarkProbe.listeners).map(listeners => listeners.size)), [0, 0, 0, 0, 0, 0]);
  // Wait past the debounce window to ensure the unmounted page cancels its timer.
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(await probe.evaluate(() => window.__bookmarkProbe.calls), callsBeforeSearch + 1);
  await probe.close();
  record('loading/error/retry, cached searches, reordered/import debounce and complete listener cleanup');

  assert.deepEqual(errors, []);
  const result = { checks, pageErrors: errors, externalRequests: requests, permission: fixture.permission, testedAt: new Date().toISOString() };
  await writeFile(path.join(output, 'results.json'), JSON.stringify(result, null, 2));
  console.log(`Verified ${checks.length} groups. Screenshots and results: ${output}`);
} finally {
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
