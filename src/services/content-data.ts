import type { ChurchEvent, DatedDevotion, Devotion, Language, MediaItem, PrayerPlan, WebsiteContent } from '../types';

export const MAX_CONTENT_BYTES = 4 * 1024 * 1024;
const languages: Language[] = ['en', 'yo'];
const posters = new Set(['pastor-preaching', 'prayer-gathering', 'revival', 'city-of-prayer', 'pastor', 'womens-ministry']);
function object(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid content.');
  return v as Record<string, unknown>;
}
function text(v: unknown, max = 5000, empty = false): string {
  if (typeof v !== 'string' || (!empty && !v.trim()) || v.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(v)) throw new Error('Invalid content text.');
  return v;
}
function list<T>(v: unknown, parse: (entry: unknown) => T, max: number, min = 0): T[] {
  if (!Array.isArray(v) || v.length < min || v.length > max) throw new Error('Invalid content list.');
  return v.map(parse);
}
function bilingual<T>(v: unknown, parse: (entry: unknown) => T): Record<Language, T> {
  const obj = object(v);
  return { en: parse(obj.en), yo: parse(obj.yo) };
}
function date(v: unknown): string {
  const key = text(v, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || Number.isNaN(Date.parse(`${key}T12:00:00Z`)) || new Date(`${key}T12:00:00Z`).toISOString().slice(0, 10) !== key) throw new Error('Invalid content date.');
  return key;
}
function unique<T>(entries: T[], key: (entry: T) => string): T[] {
  if (new Set(entries.map(key)).size !== entries.length) throw new Error('Duplicate content identifier.');
  return entries;
}
function id(v: unknown): string {
  const key = text(v, 100);
  if (!/^[a-z0-9_-]+$/.test(key)) throw new Error('Invalid content identifier.');
  return key;
}
function devotion(v: unknown): Devotion {
  const d = object(v);
  return { title: text(d.title, 200), reading: text(d.reading, 500), verse: text(d.verse, 3000), fire: text(d.fire, 3000),
    message: list(d.message, entry => text(entry), 30, 1), quote: text(d.quote, 3000), declaration: text(d.declaration, 3000),
    morning: list(d.morning, entry => text(entry, 2000), 20, 1), evening: list(d.evening, entry => text(entry, 2000), 20, 1) };
}
function dated(v: unknown): DatedDevotion {
  const d = object(v);
  return { date: date(d.date), title: bilingual(d.title, entry => text(entry, 200)), reading: text(d.reading, 500),
    memoryRef: text(d.memoryRef, 500), memory: bilingual(d.memory, entry => text(entry, 3000)), fire: text(d.fire, 3000),
    focus: bilingual(d.focus, entry => text(entry, 500)), message: bilingual(d.message, entry => list(entry, x => text(x), 30, 1)),
    quote: bilingual(d.quote, entry => text(entry, 3000)), declaration: bilingual(d.declaration, entry => text(entry, 3000)) };
}
function prayer(v: unknown): PrayerPlan {
  const p = object(v);
  const category = text(p.category, 50);
  // Stable categories preserve saved progress and the three-night layout.
  if (!['Finances', 'Education', 'Jobs', 'Marriage', 'Children', 'Health', 'Family'].includes(category)) throw new Error('Invalid prayer category.');
  const refs = list(p.refs, entry => text(entry, 1000), 3, 3);
  const themes = bilingual(p.themes, entry => list(entry, x => text(x, 1000), 3, 3));
  const points = bilingual(p.points, entry => list(entry, x => text(x, 2000), 21, 21));
  return { category, refs, themes, points, label: bilingual(p.label, entry => text(entry, 100)) };
}
function media(v: unknown): MediaItem {
  const m = object(v);
  const category = text(m.category, 20) as MediaItem['category'];
  if (!['sermon', 'prayer', 'praise', 'gathering'].includes(category)) throw new Error('Invalid media category.');
  const poster = text(m.poster, 100);
  if (!posters.has(poster)) throw new Error('Invalid media poster.');
  const slug = id(m.slug);
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Invalid media filename.');
  return { id: id(m.id), title: text(m.title, 200), category, slug, file: id(m.file), poster };
}
function event(v: unknown): ChurchEvent {
  const e = object(v);
  return { id: id(e.id), date: date(e.date), title: bilingual(e.title, entry => text(entry, 200)),
    description: bilingual(e.description, entry => text(entry, 2000, true)), time: text(e.time, 100), location: text(e.location, 500) };
}
/** Strictly select known public fields: remote content cannot change payment recipients, API hosts or execute code. */
export function parseWebsiteContent(v: unknown): WebsiteContent {
  const d = object(v);
  if (d.schemaVersion !== 1) throw new Error('Unsupported content version.');
  const updatedAt = text(d.updatedAt, 24);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(updatedAt) || Number.isNaN(Date.parse(updatedAt))) throw new Error('Invalid content timestamp.');
  const rotating = bilingual(d.rotating, entry => list(entry, devotion, 100, 1));
  for (const language of languages) if (!rotating[language].length) throw new Error('Missing devotional fallback.');
  return { schemaVersion: 1, updatedAt, sourceCommit: text(d.sourceCommit, 100, true),
    dated: unique(list(d.dated, dated, 3660), entry => entry.date), rotating,
    prayers: unique(list(d.prayers, prayer, 7, 1), entry => entry.category),
    media: unique(list(d.media, media, 1000), entry => entry.id),
    events: unique(list(d.events ?? [], event, 200), entry => entry.id) };
}
