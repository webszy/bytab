import type { MaybeRefOrGetter } from 'vue';
import { resolveSiteOrigin } from '#shared/site';
import socialCard from '../../../shared/ByTab_Brand_Kit_v1.0/05_Social_and_Marketing/og-card.png?url';

interface SiteSeo {
  title: string;
  description: string;
  path: string;
}

export function useSiteSeo(source: MaybeRefOrGetter<SiteSeo>) {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const origin = resolveSiteOrigin(config.public.siteUrl, requestUrl.origin);
  const canonical = computed(() => new URL(toValue(source).path, origin).href);
  const socialImage = new URL(socialCard, origin).href;
  const socialImageAlt = 'bytab logo on a pastel landscape';

  useSeoMeta({
    title: () => toValue(source).title,
    description: () => toValue(source).description,
    ogTitle: () => toValue(source).title,
    ogDescription: () => toValue(source).description,
    ogUrl: () => canonical.value,
    ogImage: socialImage,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: socialImageAlt,
    ogType: 'website',
    ogSiteName: 'bytab',
    twitterCard: 'summary_large_image',
    twitterTitle: () => toValue(source).title,
    twitterDescription: () => toValue(source).description,
    twitterImage: socialImage,
    twitterImageAlt: socialImageAlt,
  });
  useHead(() => ({ link: [{ rel: 'canonical', href: canonical.value }] }));
  return canonical;
}
