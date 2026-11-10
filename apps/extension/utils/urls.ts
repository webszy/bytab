export function websiteUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

export function websiteLabel(value: string) {
  return websiteUrl(value)?.hostname ?? '';
}
