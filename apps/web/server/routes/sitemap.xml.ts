import { resolveSiteOrigin, sitePaths } from '../../shared/site';

export default defineEventHandler((event) => {
  const origin = resolveSiteOrigin(useRuntimeConfig(event).public.siteUrl, getRequestURL(event).origin);
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  const urls = sitePaths.map(path => `<url><loc>${new URL(path, origin).href}</loc></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
});
