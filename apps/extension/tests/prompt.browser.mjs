import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.BYTAB_PLAYWRIGHT_MODULE || 'playwright');
const extension = fileURLToPath(new URL('../dist/chrome-mv3', import.meta.url));
const output = fileURLToPath(new URL('../.output/prompt-verification', import.meta.url));
const profile = await mkdtemp(path.join(os.tmpdir(), 'bytab-prompt-'));
await mkdir(output, { recursive: true });
const context = await chromium.launchPersistentContext(profile, {
  ...(process.env.BYTAB_CHROMIUM_EXECUTABLE ? { executablePath: process.env.BYTAB_CHROMIUM_EXECUTABLE } : { channel: 'chromium' }),
  headless: true, ignoreDefaultArgs: ['--disable-extensions'], viewport: { width: 1440, height: 900 },
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
const checks = [], errors = [], requests = [];
const record = name => { checks.push(name); console.log(`PASS ${name}`); };
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
// Deliberately isolate navigation contracts from changing third-party website behavior.
await context.route(/^https?:\/\//, route => {
  requests.push(route.request().url());
  return route.fulfill({ contentType: 'text/html', body: '<title>Prompt navigation fixture</title>' });
});
try {
  await context.addInitScript(() => {
    if (!globalThis.chrome?.tabs?.create) return;
    window.__promptTargets = [];
    const nativeCreate = chrome.tabs.create.bind(chrome.tabs);
    chrome.tabs.create = options => {
      window.__promptTargets.push(options.url);
      // tabs.create can start navigation before Playwright attaches request routing.
      // Capture the exact API boundary and create a real isolated blank tab.
      return nativeCreate({ ...options, url: 'about:blank' });
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  await page.goto('chrome://newtab/');
  const input = page.locator('#home-prompt-input');
  await input.waitFor();
  const extensionUrl = page.url();
  const options = page.locator('#prompt-bookmarks [role="option"]');
  const selected = page.locator('#prompt-bookmarks [aria-selected="true"]');
  const send = page.getByRole('button', { name: 'Open selected service', exact: true });
  const trigger = page.getByRole('button', { name: 'Select provider', exact: true });
  const countIs = count => page.waitForFunction(n => document.querySelectorAll('#prompt-bookmarks [role="option"]').length === n, count);
  const choose = async id => { await trigger.click(); await page.locator(`[data-provider="${id}"]`).click(); };
  const fill = async text => { await input.fill(''); await input.fill(text); await input.focus(); };
  const open = async (action, expected) => {
    const before = context.pages().length;
    const pending = context.waitForEvent('page', { timeout: 5000 });
    await action();
    const opened = await pending;
    assert.equal(await page.evaluate(() => window.__promptTargets.at(-1)), expected);
    await opened.waitForLoadState('domcontentloaded');
    assert.equal(context.pages().length, before + 1, 'exactly one tab opened');
    await opened.close();
    await page.bringToFront();
  };
  const fixture = await page.evaluate(async () => {
    const root = (await chrome.bookmarks.getTree())[0].children[0];
    const folder = await chrome.bookmarks.create({ parentId: root.id, title: 'Prompt test' });
    const definitions = [
      ['URL only', 'https://github.com/url-only'], ['My GitHub page', 'https://example.test/contains'],
      ['GitHub Docs', 'https://example.test/prefix'], ['GitHub', 'https://github.com/'],
      ['GitHub More 1', 'https://example.test/1'], ['GitHub More 2', 'https://example.test/2'],
      ['GitHub More 3', 'https://example.test/3'], ['GitHub More 4', 'https://example.test/4'],
      ['中文测试', 'https://example.test/chinese'], ['GitHub unsafe', 'javascript:alert(1)'],
    ];
    const entries = [];
    for (const [title, url] of definitions) entries.push(await chrome.bookmarks.create({ parentId: folder.id, title, url }));
    return { folder, entries };
  });
  await page.waitForFunction(() => document.querySelector('.dock-count')?.textContent === '10');
  await fill('github');
  await countIs(6);
  assert.equal(await selected.count(), 0);
  assert.match(await options.first().textContent(), /^GitHubgithub.com/);
  assert.equal(requests.length, 0, 'local search makes no network requests');
  await open(() => input.press('Enter'), 'https://chatgpt.com/?prompt=github');
  record('1 default Enter opens ChatGPT with matches present and no default selection');

  await fill('github'); await countIs(6); await input.press('ArrowDown');
  assert.equal(await selected.count(), 1);
  await open(() => input.press('Enter'), 'https://github.com/');
  record('2 ArrowDown + Enter opens the first bookmark only');

  await fill('github'); await countIs(6); await options.first().hover();
  assert.equal(await selected.count(), 0);
  await open(() => input.press('Enter'), 'https://chatgpt.com/?prompt=github');
  record('3 hover does not change default Enter');

  await fill('github'); await countIs(6); await input.press('ArrowDown');
  await open(() => send.click(), 'https://chatgpt.com/?prompt=github');
  record('4 blue button ignores keyboard bookmark selection');

  await fill('github'); await countIs(6); await input.press('ArrowDown'); await input.press('Escape');
  await countIs(0); assert.equal(await input.inputValue(), 'github');
  await open(() => input.press('Enter'), 'https://chatgpt.com/?prompt=github');
  record('5 Escape keeps text/provider and restores default Enter');

  await fill('github'); await countIs(6); await input.press('ArrowDown'); await input.press('x');
  await countIs(0); assert.equal(await input.getAttribute('aria-activedescendant'), null);
  await open(() => input.press('Enter'), 'https://chatgpt.com/?prompt=githubx');
  record('6 changed input clears selection and no-match list is absent');

  await fill('github'); await countIs(6); await input.press('ArrowDown'); await choose('google');
  assert.equal(await selected.count(), 0);
  assert.equal(await input.getAttribute('placeholder'), 'Search the web...');
  await open(() => input.press('Enter'), 'https://www.google.com/search?q=github');
  record('7 provider switch clears bookmark selection and Google opens search URL');

  await choose('chatgpt'); await fill('github'); await countIs(6);
  const pagesBeforeIme = context.pages().length;
  await input.dispatchEvent('compositionstart');
  await input.dispatchEvent('keydown', { key: 'ArrowDown', isComposing: true, keyCode: 229 });
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229 });
  assert.equal(await selected.count(), 0);
  assert.equal(await send.isDisabled(), true);
  await input.dispatchEvent('compositionend');
  await input.dispatchEvent('keydown', { key: 'Enter', keyCode: 13 });
  await page.waitForTimeout(80);
  assert.equal(context.pages().length, pagesBeforeIme);
  record('8 synthetic IME composition/confirmation does not navigate or select');

  await input.press('ArrowUp');
  assert.equal(await selected.getAttribute('id'), await options.last().getAttribute('id'));
  await input.press('ArrowDown');
  assert.equal(await selected.getAttribute('id'), await options.first().getAttribute('id'));
  await input.press('ArrowUp');
  assert.equal(await selected.getAttribute('id'), await options.last().getAttribute('id'));
  await input.press('Escape'); await input.press('x'); await input.press('Backspace'); await countIs(6);
  assert.equal(await selected.count(), 0);
  await open(() => options.first().click(), 'https://github.com/');
  record('keyboard wraparound, edit after Escape, mouse click without lost blur event');

  await fill('line one'); await input.press('End'); await input.press('Shift+Enter'); await input.press('x');
  assert.equal(await input.inputValue(), 'line one\nx');
  await open(async () => {
    await input.dispatchEvent('keydown', { key: 'Enter', repeat: false });
    await input.dispatchEvent('keydown', { key: 'Enter', repeat: true });
  }, 'https://chatgpt.com/?prompt=line%20one%0Ax');
  record('Shift+Enter preserves newline and held Enter does not open duplicate tabs');

  const text = '中文 &?#=+% 😀\nsecond line';
  for (const [id, base] of Object.entries({ chatgpt: 'https://chatgpt.com/?prompt=', claude: 'https://claude.ai/new?q=', grok: 'https://grok.com/?q=', google: 'https://www.google.com/search?q=', bing: 'https://www.bing.com/search?q=' })) {
    await choose(id); await fill(`  ${text}\n `);
    await open(() => send.click(), base + encodeURIComponent(text));
    const stored = await page.evaluate(() => chrome.storage.local.get(null));
    assert.equal(stored['bytab.promptProvider'], id);
    assert.ok(!JSON.stringify(stored).includes('second line'));
    assert.ok(!JSON.stringify(stored).includes(encodeURIComponent('second line')));
    assert.equal(new URL(stored['bytab.lastOpened'].url).search, '');
  }
  record('all five provider URLs, trim, Chinese/special characters/newlines, no prompt stored');

  await trigger.click();
  assert.equal(await page.locator('[data-provider="gemini"]').isDisabled(), true);
  assert.match(await page.locator('[data-provider="gemini"]').textContent(), /Coming Soon/);
  assert.equal(await page.getByRole('group', { name: 'AI Assistants', exact: true }).count(), 1);
  assert.equal(await page.getByRole('group', { name: 'Web Search', exact: true }).count(), 1);
  await page.locator('[data-provider="bing"]').press('ArrowUp');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.provider), 'google');
  await page.locator('[data-provider="google"]').press('ArrowUp');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.provider), 'grok');
  await page.screenshot({ path: path.join(output, 'providers.png') });
  await page.keyboard.press('Escape');
  const second = await context.newPage(); await second.goto(extensionUrl);
  await second.waitForFunction(() => document.querySelector('.model-label')?.textContent === 'Bing');
  await choose('claude');
  await second.waitForFunction(() => document.querySelector('.model-label')?.textContent === 'Claude');
  await second.close();
  record('Gemini disabled, grouped menu, keyboard skips disabled option, new-tab and live provider persistence');

  await fill('github'); await countIs(6); await input.press('ArrowDown');
  await page.evaluate(id => chrome.bookmarks.update(id, { title: 'Renamed', url: 'https://example.test/renamed' }), fixture.entries[3].id);
  await page.waitForFunction(() => !document.querySelector('#prompt-bookmarks [aria-selected="true"]') && document.querySelector('#prompt-bookmarks strong')?.textContent === 'GitHub Docs');
  await page.evaluate(id => chrome.bookmarks.remove(id), fixture.entries[2].id);
  await page.waitForFunction(() => document.querySelector('#prompt-bookmarks strong')?.textContent === 'GitHub More 1');
  await fill('中文'); await countIs(1);
  await fill('GITHUB.COM/URL-ONLY'); await countIs(1);
  await fill('unsafe'); await countIs(0);
  await fill('  '); await countIs(0); assert.equal(await send.isDisabled(), true);
  record('live bookmark rename/delete invalidates selection, Chinese and URL matching, unsafe URLs and empty input');

  await fill('github'); await countIs(6);
  await page.evaluate(async () => {
    const rect = document.querySelector('#prompt-bookmarks').getBoundingClientRect();
    await chrome.storage.local.set({ 'bytab.shortcuts': [{ id: 'floating', title: 'Floating shortcut', url: 'https://example.test/floating',
      position: { x: (rect.left + 20) / (innerWidth - 64), y: (rect.bottom - 90) / (innerHeight - 84) } }] });
  });
  await page.locator('.shortcut-positioned').waitFor();
  const hit = await page.evaluate(() => {
    const a = document.querySelector('#prompt-bookmarks').getBoundingClientRect();
    const b = document.querySelector('.shortcut-positioned').getBoundingClientRect();
    const x = Math.max(a.left, b.left) + 20, y = Math.max(a.top, b.top) + 20;
    return { overlaps: x < Math.min(a.right, b.right) && y < Math.min(a.bottom, b.bottom),
      isResult: !!document.elementFromPoint(x, y)?.closest('#prompt-bookmarks') };
  });
  assert.ok(hit.overlaps && hit.isResult, JSON.stringify(hit));
  await page.evaluate(() => chrome.storage.local.remove('bytab.shortcuts'));
  record('floating bookmark candidates stay above detached shortcut tiles');
  await page.locator('.home-time').click(); await countIs(0);
  await input.focus(); await input.press('x'); await input.press('Backspace'); await countIs(6);
  for (const [width, height] of [[1440, 900], [800, 720], [400, 720], [320, 640]]) {
    await page.setViewportSize({ width, height });
    const bounds = await page.evaluate(() => {
      const a = document.querySelector('.extension-prompt').getBoundingClientRect();
      const b = document.querySelector('#prompt-bookmarks').getBoundingClientRect();
      return { input: { left: a.left, right: a.right, bottom: a.bottom }, list: { left: b.left, right: b.right, top: b.top, bottom: b.bottom }, scroll: document.documentElement.scrollWidth, height: innerHeight };
    });
    assert.ok(Math.abs(bounds.input.left - bounds.list.left) <= 2 && Math.abs(bounds.input.right - bounds.list.right) <= 2);
    assert.ok(bounds.list.top >= bounds.input.bottom && bounds.scroll <= width);
    assert.ok(bounds.list.bottom <= height, JSON.stringify(bounds));
    await page.screenshot({ path: path.join(output, `prompt-${width}x${height}.png`) });
    await trigger.click();
    const menu = await page.locator('#home-provider-options').boundingBox();
    assert.ok(menu.x >= 0 && menu.x + menu.width <= width && menu.y + menu.height <= height, JSON.stringify(menu));
    await page.locator('[data-provider="claude"]').press('Escape');
    await fill('github'); await countIs(6);
  }
  record('outside dismissal and responsive floating results without page overflow');
  assert.deepEqual(await page.evaluate(() => chrome.runtime.getManifest().permissions.sort()), ['bookmarks', 'sessions', 'storage']);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, [], 'search and captured submissions make no external requests');
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ checks, errors, requests, note: 'chrome.tabs.create targets captured; real blank tabs opened to prevent external requests. Verifies navigation API URLs, not third-party page rendering/prefill.', testedAt: new Date().toISOString() }, null, 2));
  console.log(`Verified ${checks.length} groups. Results: ${output}`);
} finally {
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
