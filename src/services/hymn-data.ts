import type { Hymn, HymnCollection, Language } from '../types';

export const bookSize = (collection: HymnCollection) => collection === 'regular' ? 1000 : 50;
const MAX_VERSES = 40;
const MAX_TEXT = 8000;
const BAD_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;
const text = (value: unknown, maximum = MAX_TEXT): value is string => typeof value === 'string' && value.length <= maximum && !BAD_TEXT.test(value);

export function isHymnKey(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 32) return false;
  const match = /^(regular|various):(en|yo):([1-9]\d{0,3})$/.exec(value);
  return !!match && Number(match[3]) <= bookSize(match[1] as HymnCollection);
}

export function isCachedHymn(value: unknown): value is Hymn {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const h = value as Partial<Hymn>;
  return isHymnKey(h.key) && (h.language === 'en' || h.language === 'yo') && (h.collection === 'regular' || h.collection === 'various')
    && Number.isInteger(h.number) && h.key === `${h.collection}:${h.language}:${h.number}`
    && text(h.title, 1000) && !!h.title.trim() && text(h.category, 1000)
    && (h.scripture === null || text(h.scripture, 1000)) && (h.chorus === null || text(h.chorus))
    && Array.isArray(h.verses) && h.verses.length > 0 && h.verses.length <= MAX_VERSES && h.verses.every(verse => text(verse) && !!verse.trim())
    && new TextEncoder().encode(JSON.stringify(h)).byteLength <= 32768;
}

export function validateCompleteBooks(hymns: unknown): hymns is Hymn[] {
  if (!Array.isArray(hymns) || hymns.length !== 2100 || !hymns.every(isCachedHymn)) return false;
  const keys = new Set(hymns.map(h => h.key));
  if (keys.size !== hymns.length) return false;
  return (['en', 'yo'] as const).every(language => (['regular', 'various'] as const).every(collection =>
    Array.from({ length: bookSize(collection) }, (_, i) => `${collection}:${language}:${i + 1}`).every(key => keys.has(key))));
}

export function normaliseSearch(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function lines(value: unknown, depth = 0): string {
  if (depth > 6) throw new Error('The hymn text is too deeply nested.');
  if (typeof value === 'string') {
    if (!text(value)) throw new Error('The hymn text is invalid.');
    return value.trim();
  }
  if (Array.isArray(value)) {
    if (value.length > 128) throw new Error('The hymn text is too large.');
    const result = value.map(item => lines(item, depth + 1)).filter(Boolean).join('\n');
    if (result.length > MAX_TEXT) throw new Error('The hymn text is too large.');
    return result;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (!('text' in obj) && !('lines' in obj)) throw new Error('The hymn text is invalid.');
    return lines(obj.text ?? obj.lines ?? '', depth + 1);
  }
  if (value !== null && value !== undefined) throw new Error('The hymn text is invalid.');
  return '';
}

export function parseCollection(data: unknown, language: Language, collection: HymnCollection): Hymn[] {
  if (!Array.isArray(data) || !data.length || data.length > bookSize(collection)) throw new Error('The hymn collection is empty or invalid.');
  const seen = new Set<number>();
  return data.map(raw => {
    if (!raw || typeof raw !== 'object') throw new Error('The hymn collection contains an invalid entry.');
    const number = typeof raw.id === 'number' || (typeof raw.id === 'string' && /^\d{1,4}$/.test(raw.id)) ? Number(raw.id) : NaN;
    if (!Array.isArray(raw.stanzas) || raw.stanzas.length > MAX_VERSES) throw new Error('The hymn verses are invalid.');
    const verses: string[] = raw.stanzas.map((verse: unknown) => lines(verse));
    if (!Number.isInteger(number) || number < 1 || number > bookSize(collection) || seen.has(number) || !verses.length || verses.some(verse => !verse)) throw new Error('The hymn collection contains invalid numbering or verses.');
    seen.add(number);
    // Upstream titles sometimes contain scripture headings; identify the hymn by its opening line.
    const title = verses[0].split('\n')[0].trim() || String(raw.title || `Hymn ${number}`);
    if ((raw.category != null && !text(raw.category, 1000)) || (raw.scripture != null && !text(raw.scripture, 1000))) throw new Error('The hymn metadata is invalid.');
    const hymn: Hymn = {
      key: `${collection}:${language}:${number}`, number, language, collection, title,
      category: raw.category || '', scripture: raw.scripture ?? null,
      verses, chorus: lines(raw.chorus) || null,
    };
    if (!isCachedHymn(hymn)) throw new Error('The hymn entry is invalid.');
    return hymn;
  }).sort((a, b) => a.number - b.number);
}

export function filterHymns(hymns: Hymn[], query: string, language: Language, collection: HymnCollection, favourites?: Set<string>): Hymn[] {
  if (typeof query !== 'string' || query.length > 200) return [];
  const numeric = query.trim().match(/^(?:hymn\s*|#\s*)?(\d+)$/i);
  const tokens = normaliseSearch(query).split(' ').filter(Boolean);
  return hymns.filter(h => {
    if (h.language !== language || h.collection !== collection || (favourites && !favourites.has(h.key))) return false;
    if (numeric) return h.number === Number(numeric[1]);
    if (!tokens.length) return true;
    const text = normaliseSearch(`${h.title}\n${h.verses.join('\n')}\n${h.chorus || ''}`);
    return tokens.every(token => text.includes(token));
  });
}
