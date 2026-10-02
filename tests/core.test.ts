import assert from 'node:assert/strict';
import { test } from 'node:test';
import { content, getDevotion, lagosDateKey, shiftDate } from '../src/data/content';
import { filterHymns, normaliseSearch, parseCollection } from '../src/services/hymn-data';
import { giftAmount } from '../src/services/giving';
import { isDateKey, parsePreferences } from '../src/services/preferences';

const stanza = (...text: string[]) => ({ lines: text.map(value => ({ text: value, dynamic: null })) });
const source = [
  { id: 30, title: 'Scripture heading', category: 'Praise', stanzas: [stanza('Another hymn', 'Mercy carries us home')], chorus: { lines: [{ text: 'Hope for tomorrow' }] } },
  { id: 3, title: 'A meter rather than a title', category: 'Praise', scripture: 'Psalm 150', stanzas: [stanza('Praise the King', 'All creation sings'), stanza('A second verse', 'Grace for every morning'), stanza('A third verse')], chorus: null },
];
const english = parseCollection(source, 'en', 'regular');
const yoruba = parseCollection([{ id: 3, stanzas: [stanza('Ẹ yin Olúwa', 'Ìyìn àti ọpẹ́ fún Ọlọ́run')] }], 'yo', 'regular');
const additional = parseCollection([{ id: 3, stanzas: [stanza('An additional hymn')] }], 'en', 'various');
const all = [...english, ...yoruba, ...additional];

test('A hymn keeps all its stanzas under one number, and entries sort by hymn number', () => {
  assert.deepEqual(english.map(h => h.number), [3, 30]);
  assert.equal(english[0].verses.length, 3);
  assert.equal(english[0].verses[0], 'Praise the King\nAll creation sings');
  assert.equal(english[0].title, 'Praise the King');
  assert.equal(english[1].chorus, 'Hope for tomorrow');
});

test('Number search is exact, and books and languages remain separate', () => {
  for (const query of ['3', '003', '#3', 'hymn 3']) assert.deepEqual(filterHymns(all, query, 'en', 'regular').map(h => h.key), ['regular:en:3']);
  assert.deepEqual(filterHymns(all, '3', 'yo', 'regular').map(h => h.key), ['regular:yo:3']);
  assert.deepEqual(filterHymns(all, '3', 'en', 'various').map(h => h.key), ['various:en:3']);
});

test('Search finds later verses and choruses, regardless of word order or case', () => {
  assert.equal(filterHymns(all, 'MORNING grace', 'en', 'regular')[0].number, 3);
  assert.equal(filterHymns(all, 'hope tomorrow', 'en', 'regular')[0].number, 30);
  assert.equal(filterHymns(all, 'unmatched phrase', 'en', 'regular').length, 0);
});

test('Yoruba searches work with or without tone marks and underdots', () => {
  assert.equal(normaliseSearch('ÌYÌN àti ỌPẸ́'), 'iyin ati ope');
  assert.equal(filterHymns(all, 'iyin ope olorun', 'yo', 'regular')[0].number, 3);
  assert.equal(filterHymns(all, 'ọpẹ́', 'yo', 'regular')[0].number, 3);
});

test('Favourite filtering does not leak entries from a different language or book', () => {
  const favourites = new Set(['regular:yo:3', 'regular:en:30']);
  assert.deepEqual(filterHymns(all, '', 'en', 'regular', favourites).map(h => h.number), [30]);
  assert.equal(filterHymns(all, '', 'en', 'various', favourites).length, 0);
});

test('Invalid upstream entries never become a silently incomplete hymn book', () => {
  assert.throws(() => parseCollection([], 'en', 'regular'));
  assert.throws(() => parseCollection([source[0], source[0]], 'en', 'regular'));
  assert.throws(() => parseCollection([{ id: 1, stanzas: [] }], 'en', 'regular'));
  assert.throws(() => parseCollection([null], 'en', 'regular'));
  assert.throws(() => parseCollection([{ id: -1, stanzas: [stanza('Verse')] }], 'en', 'regular'));
});

test('The Nigeria day changes at 23:00 UTC, independently of the device time zone', () => {
  assert.equal(lagosDateKey(new Date('2026-09-30T22:59:59Z')), '2026-09-30');
  assert.equal(lagosDateKey(new Date('2026-09-30T23:00:00Z')), '2026-10-01');
  assert.equal(shiftDate('2028-02-28', 1), '2028-02-29');
  assert.equal(shiftDate('2026-10-01', -1), '2026-09-30');
});

test('The imported October month has a complete bilingual reading for every day', () => {
  assert.equal(content.dated.length, 31);
  for (let day = 1; day <= 31; day++) {
    const key = `2026-10-${String(day).padStart(2, '0')}`;
    for (const language of ['en', 'yo'] as const) {
      const devotion = getDevotion(key, language);
      assert.ok(devotion.title && devotion.reading && devotion.verse && devotion.fire && devotion.quote && devotion.declaration, key);
      assert.ok(devotion.message.length > 0);
      assert.equal(devotion.morning.length, 3);
      assert.equal(devotion.evening.length, 3);
      assert.ok(!JSON.stringify(devotion).includes('{focus}'));
    }
  }
  assert.notEqual(getDevotion('2026-10-01', 'en').title, getDevotion('2026-10-01', 'yo').title);
});

test('Readings remain available outside the imported month', () => {
  for (const date of ['2026-09-30', '2026-11-01', '2027-01-01']) for (const lang of ['en', 'yo'] as const) assert.ok(getDevotion(date, lang).title);
});

test('Every prayer category has three complete seven-point nights in both languages', () => {
  assert.equal(content.prayers.length, 7);
  for (const plan of content.prayers) {
    assert.equal(plan.refs.length, 3);
    for (const lang of ['en', 'yo'] as const) {
      assert.equal(plan.themes[lang].length, 3);
      assert.equal(plan.points[lang].length, 21);
      assert.ok(plan.points[lang].every(point => !!point.trim()));
    }
  }
});

test('All current media have unique descriptive download names and a supported category', () => {
  assert.equal(content.media.length, 12);
  assert.equal(new Set(content.media.map(m => m.slug)).size, 12);
  assert.ok(content.media.every(item => /^[a-z0-9-]+$/.test(item.slug) && ['prayer', 'sermon', 'praise', 'gathering'].includes(item.category)));
});

test('Gift amounts reject invalid values before any external payment handoff', () => {
  assert.deepEqual(giftAmount(''), { valid: true, text: 'a gift' });
  assert.equal(giftAmount('5000').text, '₦5,000');
  assert.equal(giftAmount('10.25').text, '₦10.25');
  for (const invalid of ['0', '-2', '1e3', 'NaN', 'Infinity', '12.345', '5,000', '1000000001']) assert.equal(giftAmount(invalid).valid, false, invalid);
});

test('Damaged saved preferences recover safely without invalid dates or duplicate favourites', () => {
  const prefs = parsePreferences({ language: 'xx', textSize: 100, hymnFavourites: ['regular:en:3', 'regular:en:3', 'bad', 3], devotionalBookmarks: ['2026-02-30', '2026-10-01'], prayerProgress: ['Finances:0:1', 'Finances:8:1'], downloads: [null, { uri: 'bad' }] });
  assert.equal(prefs.language, 'en');
  assert.equal(prefs.textSize, 26);
  assert.deepEqual(prefs.hymnFavourites, ['regular:en:3']);
  assert.deepEqual(prefs.devotionalBookmarks, ['2026-10-01']);
  assert.deepEqual(prefs.prayerProgress, ['Finances:0:1']);
  assert.deepEqual(prefs.downloads, []);
  assert.equal(parsePreferences(null).textSize, 18);
  assert.equal(parsePreferences({ textSize: NaN }).textSize, 18);
  assert.equal(isDateKey('2028-02-29'), true);
  assert.equal(isDateKey('2026-02-29'), false);
});
