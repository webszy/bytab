import type { MaybeRefOrGetter } from 'vue';
import { resolveSiteOrigin } from '#shared/site';

interface SiteSeo {
  title: string;
  description: string;
  path: string;
}

export function useSiteSeo(source: MaybeRefOrGetter<SiteSeo>) {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const canonical = computed(() => new URL(
    toValue(source).path,
    resolveSiteOrigin(config.public.siteUrl, requestUrl.origin),
  ).href);

  useSeoMeta({
    title: () => toValue(source).title,
    description: () => toValue(source).description,
    ogTitle: () => toValue(source).title,
    ogDescription: () => toValue(source).description,
    ogUrl: () => canonical.value,
    ogType: 'website',
    ogSiteName: 'bytab',
    twitterCard: 'summary',
    twitterTitle: () => toValue(source).title,
    twitterDescription: () => toValue(source).description,
  });
  useHead(() => ({ link: [{ rel: 'canonical', href: canonical.value }] }));
}
