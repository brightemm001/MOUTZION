import assert from 'node:assert/strict';
import { test } from 'node:test';
import snapshot from '../src/data/website.json';
import { getDevotion } from '../src/data/content';
import { parseWebsiteContent } from '../src/services/content-data';
const source = () => JSON.parse(JSON.stringify({ ...snapshot, schemaVersion: 1, updatedAt: '2026-10-01T12:00:00.000Z', events: [] }));

test('The complete existing catalog passes strict validation with English and Yoruba intact', () => {
  const parsed = parseWebsiteContent(source());
  assert.equal(parsed.media.length, snapshot.media.length);
  assert.equal(parsed.dated.length, snapshot.dated.length);
  assert.deepEqual(parsed.rotating, snapshot.rotating);
});
test('A published recording and dated bilingual devotional work without bundled-code changes', () => {
  const next = source();
  next.media.unshift({ ...next.media[0], id: 'new-recording', slug: 'new-recording', file: 'new-recording', title: 'A New Message' });
  next.dated.push({ ...next.dated[0], date: '2026-11-01', title: { en: 'A New Day', yo: 'Ọjọ́ Tuntun' } });
  const parsed = parseWebsiteContent(next);
  assert.equal(parsed.media[0].title, 'A New Message');
  assert.equal(getDevotion('2026-11-01', 'en', parsed).title, 'A New Day');
  assert.equal(getDevotion('2026-11-01', 'yo', parsed).title, 'Ọjọ́ Tuntun');
});
test('Media paths, poster identifiers, duplicate IDs and unsupported categories are rejected', () => {
  for (const patch of [{ file: '../private' }, { file: 'https://evil.example/file' }, { slug: '../escape' }, { poster: 'https://evil.example/a.jpg' }, { category: 'admin' }]) {
    const next = source(); Object.assign(next.media[0], patch); assert.throws(() => parseWebsiteContent(next));
  }
  const next = source(); next.media.push(next.media[0]); assert.throws(() => parseWebsiteContent(next));
});
test('Missing languages, invalid dates and incompatible prayer layouts are rejected', () => {
  for (const mutate of [
    (n: ReturnType<typeof source>) => { n.rotating.yo = []; },
    (n: ReturnType<typeof source>) => { n.dated[0].date = '2026-02-30'; },
    (n: ReturnType<typeof source>) => { n.dated[0].title.yo = null; },
    (n: ReturnType<typeof source>) => { n.prayers[0].points.en = ['short']; },
    (n: ReturnType<typeof source>) => { n.updatedAt = 'invalid'; },
    (n: ReturnType<typeof source>) => { n.schemaVersion = 2; },
  ]) { const next = source(); mutate(next); assert.throws(() => parseWebsiteContent(next)); }
});
test('Limits reject oversized fields, control characters and excessive item counts', () => {
  for (const title of ['x'.repeat(201), 'Text\u0000secret', 'Text\u202edisguise']) {
    const next = source(); next.media[0].title = title; assert.throws(() => parseWebsiteContent(next));
  }
  const next = source(); next.media = Array(1001).fill(next.media[0]); assert.throws(() => parseWebsiteContent(next));
});
test('Empty media and event lists are valid; executable or configuration fields are stripped', () => {
  const next = source(); next.media = []; next.cardCheckoutUrl = 'https://evil.example'; next.secret = 'never keep';
  const parsed = parseWebsiteContent(next);
  assert.deepEqual(parsed.media, []); assert.equal('cardCheckoutUrl' in parsed, false); assert.equal('secret' in parsed, false);
});
test('Events validate bilingual text, dates, identifiers and plain locations', () => {
  const next = source(); next.events = [{ id: 'revival', date: '2026-12-01', title: { en: 'Revival', yo: 'Ìsọjí' }, description: { en: '', yo: '' }, location: 'Okuku', time: '4:00–6:00 PM' }];
  assert.equal(parseWebsiteContent(next).events?.[0].title.yo, 'Ìsọjí');
  next.events[0].date = '2026-12-32'; assert.throws(() => parseWebsiteContent(next));
});
