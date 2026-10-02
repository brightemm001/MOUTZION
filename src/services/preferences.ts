import type { Preferences } from '../types';
import { isHymnKey } from './hymn-data';
import { isDownloadMetadata } from './media-policy';

export const MAX_PREFERENCES_LENGTH = 256 * 1024;

export const defaultPreferences: Preferences = { language: 'en', textSize: 18, hymnFavourites: [], devotionalBookmarks: [], devotionalRead: [], prayerProgress: [], downloads: [] };

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function safeList(value: unknown, maximum: number): string[] {
  return Array.isArray(value) ? [...new Set(value.slice(0, maximum * 2).filter((x): x is string => typeof x === 'string' && x.length <= 64))].slice(0, maximum) : [];
}

export function parsePreferences(value: unknown): Preferences {
  const input = value && typeof value === 'object' ? value as Partial<Preferences> : {};
  return {
    ...defaultPreferences,
    language: input.language === 'yo' ? 'yo' : 'en',
    textSize: typeof input.textSize === 'number' && Number.isFinite(input.textSize) ? Math.max(16, Math.min(26, input.textSize)) : 18,
    hymnFavourites: safeList(input.hymnFavourites, 2100).filter(isHymnKey),
    devotionalBookmarks: safeList(input.devotionalBookmarks, 3660).filter(isDateKey),
    devotionalRead: safeList(input.devotionalRead, 3660).filter(isDateKey),
    prayerProgress: safeList(input.prayerProgress, 147).filter(x => /^(Finances|Education|Jobs|Marriage|Children|Health|Family):[0-2]:[0-6]$/.test(x)),
    downloads: Array.isArray(input.downloads) ? [...new Map(input.downloads.slice(0, 48).filter(isDownloadMetadata).map(d => [d.key, d])).values()].slice(0, 24) : [],
  };
}
