import { resolveSiteOrigin } from '../../shared/site';

export default defineEventHandler((event) => {
  const origin = resolveSiteOrigin(useRuntimeConfig(event).public.siteUrl, getRequestURL(event).origin);
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  return `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
});
