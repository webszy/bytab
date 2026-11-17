import type { BookmarkSearchEntry } from './bookmarkTree';
import { websiteUrl } from './urls.ts';

// Reuse the catalog's existing flattened index. Each tier keeps Chrome's order.
export function searchPromptBookmarks(index: BookmarkSearchEntry[], query: string): BookmarkSearchEntry[] {
  const text = query.trim().toLowerCase();
  if (!text) return [];
  const tiers: BookmarkSearchEntry[][] = [[], [], [], []];
  for (const entry of index) {
    const { title, url } = entry.node;
    if (!url || !websiteUrl(url)) continue;
    const label = title.toLowerCase();
    const rank = label === text ? 0 : label.startsWith(text) ? 1 : label.includes(text) ? 2
      : url.toLowerCase().includes(text) ? 3 : -1;
    if (rank >= 0 && tiers[rank]!.length < 6) tiers[rank]!.push(entry);
  }
  return tiers.flat().slice(0, 6);
}
