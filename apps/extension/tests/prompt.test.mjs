import assert from 'node:assert/strict';
import { test } from 'node:test';
import { promptDestination, parsePromptProvider, promptProviders } from '../utils/promptProviders.ts';
import { searchPromptBookmarks } from '../utils/promptBookmarks.ts';

const entry = (id, title, url = `https://example.test/${id}`) => ({ node: { id, title, url }, text: `${title} ${url}`.toLowerCase(), folderPath: 'Test' });

test('provider allowlist builds exact encoded destinations and never enables Gemini', () => {
  const text = '中文 prompt\nline 2 &?#=+% 😀';
  const bases = {
    chatgpt: 'https://chatgpt.com/?prompt=', claude: 'https://claude.ai/new?q=', grok: 'https://grok.com/?q=',
    google: 'https://www.google.com/search?q=', bing: 'https://www.bing.com/search?q=',
  };
  for (const [id, base] of Object.entries(bases)) {
    assert.equal(promptDestination(id, `  ${text}\n `).url, base + encodeURIComponent(text));
    assert.equal(promptDestination(id, ' \n '), null);
    assert.equal(parsePromptProvider(id), id);
  }
  for (const id of ['gemini', 'bookmarks', 'https://evil.example', '__proto__', undefined, {}]) {
    assert.equal(promptDestination(id, text), null);
    assert.equal(parsePromptProvider(id), 'chatgpt');
  }
  assert.equal(promptProviders.length, 6);
});

test('bookmark ranking is exact, prefix, title contains, URL contains; ties retain native order', () => {
  const index = [entry('url', 'Code', 'https://github.com/'), entry('contains', 'My GitHub page'),
    entry('prefix', 'GitHub Docs'), entry('exact', 'GitHub'), entry('exact2', 'GITHUB')];
  assert.deepEqual(searchPromptBookmarks(index, ' GITHUB ').map(x => x.node.id), ['exact', 'exact2', 'prefix', 'contains', 'url']);
  assert.deepEqual(index.map(x => x.node.id), ['url', 'contains', 'prefix', 'exact', 'exact2']);
});

test('search is capped at six, matches Chinese and URLs, ignores empty and unsafe entries', () => {
  const index = [...Array.from({ length: 10 }, (_, i) => entry(`${i}`, `搜索 ${i}`)),
    entry('unsafe', '搜索', 'javascript:alert(1)'), entry('data', '搜索', 'data:text/html,hello'),
    entry('file', '搜索', 'file:///private/test'), entry('invalid', '搜索', 'invalid')];
  assert.deepEqual(searchPromptBookmarks(index, '搜索').map(x => x.node.id), ['0', '1', '2', '3', '4', '5']);
  assert.equal(searchPromptBookmarks(index, 'EXAMPLE.TEST/9')[0].node.id, '9');
  assert.deepEqual(searchPromptBookmarks(index, ''), []);
  assert.deepEqual(searchPromptBookmarks(index, '  '), []);
  assert.deepEqual(searchPromptBookmarks(index, 'nomatch'), []);
});
