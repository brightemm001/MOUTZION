export interface LinkPolicy {
  website: string;
  cardCheckoutUrl: string;
  whatsapp: string;
  facebook: string;
  tiktok: string;
}

const CHECKOUT_HOSTS = new Set(['paystack.com', 'checkout.paystack.com', 'flutterwave.com', 'checkout.flutterwave.com']);
const UNSAFE_CHARACTERS = /[\u0000-\u0020\u007f-\u009f\u202a-\u202e\u2066-\u2069\\]/;

function httpsUrl(value: unknown, maxLength = 2048): URL | null {
  if (typeof value !== 'string' || !value || value.length > maxLength || UNSAFE_CHARACTERS.test(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port || host.endsWith('.')
      || !host.includes('.') || /(^|\.)(localhost|local|internal)$/.test(host)
      || /^[\d.]+$/.test(host) || host.includes(':')) return null;
    return url;
  } catch { return null; }
}

/** Build-time public configuration must be an HTTPS website origin, not a redirect or credential. */
export function websiteOrigin(value: unknown): string | null {
  const url = httpsUrl(value);
  return url && url.pathname === '/' && !url.search && !url.hash ? url.origin : null;
}

/** Only an operator-configured checkout on these payment providers is accepted. */
export function checkoutUrl(value: unknown): string | null {
  const url = httpsUrl(value);
  return url && CHECKOUT_HOSTS.has(url.hostname) ? url.href : null;
}

export function allowedExternalUrl(value: unknown, policy: LinkPolicy): string | null {
  if (value === `tel:+${policy.whatsapp}` && /^\d{10,15}$/.test(policy.whatsapp)) return value;
  const url = httpsUrl(value, 65536);
  if (!url) return null;
  const website = websiteOrigin(policy.website);
  if (website && url.origin === website) return url.href;
  const checkout = checkoutUrl(policy.cardCheckoutUrl);
  if (checkout && url.href === checkout) return url.href;
  if ([policy.facebook, policy.tiktok].some(expected => httpsUrl(expected)?.href === url.href)) return url.href;
  if (url.origin === 'https://hymnize.com' && url.pathname === '/' && !url.search && !url.hash) return url.href;
  if (url.origin === 'https://wa.me' && url.pathname === `/${policy.whatsapp}` && !url.hash
    && [...url.searchParams.keys()].every(key => key === 'text') && url.searchParams.getAll('text').length <= 1) return url.href;
  if (url.origin === 'https://www.google.com' && url.pathname === '/maps/search/' && !url.hash
    && url.searchParams.get('api') === '1' && !!url.searchParams.get('query') && url.searchParams.get('query')!.length <= 2000
    && [...url.searchParams.keys()].every(key => key === 'api' || key === 'query')
    && url.searchParams.getAll('api').length === 1 && url.searchParams.getAll('query').length === 1) return url.href;
  return null;
}
