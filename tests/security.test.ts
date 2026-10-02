import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { readLiteralData } from '../scripts/literal-data.mjs';
import { allowedExternalUrl, checkoutUrl, websiteOrigin } from '../src/services/url-policy';
import { validateMessageForm } from '../src/services/forms';
import { parseCollection, isCachedHymn, validateCompleteBooks } from '../src/services/hymn-data';
import { CHUNK_SIZE, MAX_CACHE_BYTES, parseCachedBooks, parseManifest } from '../src/services/hymn-cache';
import { readLimitedBytes, readLimitedJson } from '../src/services/network-limits';
import { content } from '../src/data/content';
import { catalogMedia, downloadFileName, isDownloadMetadata, isSandboxDownload, MAX_MEDIA_BYTES, mediaMimeAllowed } from '../src/services/media-policy';
import { parsePreferences } from '../src/services/preferences';

const policy = {
  website: 'https://mountzion-lemon.vercel.app', cardCheckoutUrl: 'https://paystack.com/pay/church-gift',
  whatsapp: '2349154494093', facebook: 'https://web.facebook.com/olaniyi.olawumi.184', tiktok: 'https://www.tiktok.com/@virtous.women25',
};

test('External handoffs reject insecure schemes, unapproved destinations and URL parser tricks', () => {
  const rejected = ['http://mountzion-lemon.vercel.app', 'https://evil.example', 'javascript:alert(1)', 'file:///private/data', 'intent://scan', 'tel:+1234567890',
    'https://mountzion-lemon.vercel.app.evil.example', 'https://mountzion-lemon.vercel.app@evil.example', 'https://evil.example@mountzion-lemon.vercel.app',
    'https://mountzion-lemon.vercel.app:8443', 'https://mountzion-lemon.vercel.app\\@evil.example', 'https://mountzion-lemon.vercel.app\n',
    'https://paystack.com/pay/another-recipient', 'https://wa.me/2349999999999?text=Hello', 'https://www.google.com/url?url=https://evil.example',
    'https://web.facebook.com/another-account', 'https://wa.me/2349154494093?redirect=https://evil.example'];
  for (const url of rejected) assert.equal(allowedExternalUrl(url, policy), null, url);
  for (const url of [policy.website, policy.facebook, policy.tiktok, policy.cardCheckoutUrl, `tel:+${policy.whatsapp}`, 'https://hymnize.com',
    `https://wa.me/${policy.whatsapp}?text=${encodeURIComponent('Ẹ ṣé\nPrayer & praise')}`, 'https://www.google.com/maps/search/?api=1&query=Okuku',
    `${policy.website}/media/sermons/snapchat-1027629946.mp4`]) assert.ok(allowedExternalUrl(url, policy), url);
});

test('Build configuration rejects private addresses, embedded credentials and payment lookalike hosts', () => {
  for (const value of ['http://example.com', 'https://127.0.0.1', 'https://192.168.1.1', 'https://[::1]', 'https://localhost', 'https://app.local',
    'https://user:pass@example.com', 'https://example.com/path', 'https://example.com/?redirect=evil', 'https://example.com#fragment']) assert.equal(websiteOrigin(value), null);
  assert.equal(websiteOrigin('https://mountzion-lemon.vercel.app/'), policy.website);
  for (const value of ['https://paystack.com.evil.example/pay/x', 'https://evil.example', 'http://paystack.com/pay/x', 'https://user:pass@paystack.com/pay/x']) assert.equal(checkoutUrl(value), null);
  assert.equal(checkoutUrl(policy.cardCheckoutUrl), policy.cardCheckoutUrl);
});

test('Submission validation enforces limits independently of TextInput and preserves Yoruba/plain text', () => {
  const valid = { name: ' Ọlá ', message: 'Ẹ jọ̀ọ́, ẹ gbàdúrà fún ẹbí mi. <b>Plain text</b>', kind: 'prayer' };
  const result = validateMessageForm(valid);
  assert.ok(result.valid);
  assert.equal(result.name, 'Ọlá');
  assert.equal(result.message, valid.message);
  for (const patch of [{ name: '' }, { name: 'n'.repeat(101) }, { name: 'Name\nPretend sender' }, { message: 'short' }, { message: {} },
    { message: 'x'.repeat(2001) }, { message: 'Message\u0000hidden' }, { message: 'Message\u202ehidden' }, { kind: 'other' }]) assert.equal(validateMessageForm({ ...valid, ...patch }).valid, false);
  assert.equal(validateMessageForm({ ...valid, message: 'x'.repeat(2000) }).valid, true);
  assert.equal(validateMessageForm({ ...valid, kind: 'testimony', message: 'x'.repeat(5000) }).valid, true);
  assert.equal(validateMessageForm({ ...valid, kind: 'testimony', message: 'x'.repeat(5001) }).valid, false);
});

test('Literal imports never execute functions, getters, template interpolation or prototype mutations', () => {
  const parsed = readLiteralData('const data = [{word: "Ẹ ṣé", n: -2, ok: true, value: null}, `literal text`];', 'data');
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), [{ word: 'Ẹ ṣé', n: -2, ok: true, value: null }, 'literal text']);
  assert.deepEqual(JSON.parse(JSON.stringify(readLiteralData('window.data = {values:[1,2,3]};', 'data', true))), { values: [1, 2, 3] });
  for (const expression of ['(()=>{globalThis.__mountZionImportExecuted=true;return [];})()', '{get x(){throw Error("executed")}}',
    '`value ${process.env.HOME}`', '{__proto__: {polluted:true}}', '{constructor: {prototype:{polluted:true}}}', '{["computed"]:1}',
    '[...otherData]', '{a:1,a:2}', 'JSON.parse("[]")']) assert.throws(() => readLiteralData(`const data = ${expression};`, 'data'));
  assert.equal('__mountZionImportExecuted' in globalThis, false);
});

test('Hymn/cache validation rejects render-breaking objects, invalid numbering and deep/huge payloads', () => {
  const hymn = parseCollection([{ id: 1, stanzas: [{ lines: [{ text: 'Original verse' }] }] }], 'en', 'regular')[0];
  assert.equal(isCachedHymn(hymn), true);
  for (const patch of [{ title: {} }, { category: [] }, { scripture: {} }, { verses: [{}] }, { chorus: {} }, { number: 2 }, { key: 'regular:en:1001' }]) assert.equal(isCachedHymn({ ...hymn, ...patch }), false);
  let deeplyNested: unknown = 'Text';
  for (let i = 0; i < 30; i++) deeplyNested = [deeplyNested];
  for (const entry of [{ id: 1, stanzas: [deeplyNested] }, { id: 1, stanzas: ['x'.repeat(8001)] }, { id: true, stanzas: ['Text'] },
    { id: 1, stanzas: [''] }, { id: 1, stanzas: [null] }, { id: 1001, stanzas: ['Text'] }]) assert.throws(() => parseCollection([entry], 'en', 'regular'));
  assert.equal(validateCompleteBooks([hymn]), false);
  assert.equal(parseManifest(JSON.stringify({ generation: '../../preferences', chunks: 35, count: 2100, savedAt: '2026-10-01T12:00:00.000Z' })), null);
  assert.equal(parseManifest('{bad json'), null);
});

test('Offline hymn cache accepts only complete, unique, bounded bilingual books', () => {
  const hymns = (['en', 'yo'] as const).flatMap(language => (['regular', 'various'] as const).flatMap(collection =>
    parseCollection(Array.from({ length: collection === 'regular' ? 1000 : 50 }, (_, i) => ({ id: i + 1, stanzas: ['A test-only hymn verse'] })), language, collection)));
  const manifest = parseManifest(JSON.stringify({ generation: '1790846400000-abc123', chunks: 35, count: 2100, savedAt: '2026-10-01T12:00:00.000Z' }))!;
  const chunks = Array.from({ length: 35 }, (_, i) => JSON.stringify(hymns.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)));
  assert.equal(parseCachedBooks(chunks, manifest)?.length, 2100);
  assert.equal(parseCachedBooks(chunks.slice(1), manifest), null);
  assert.equal(parseCachedBooks(chunks.map((c, i) => i === 0 ? '[{"title":{}}]' : c), manifest), null);
  const duplicate = [...hymns]; duplicate[0] = duplicate[1];
  assert.equal(validateCompleteBooks(duplicate), false);
  assert.equal(parseCachedBooks(chunks.map((c, i) => i === 0 ? 'x'.repeat(MAX_CACHE_BYTES + 1) : c), manifest), null);
});

test('Streaming response limits work without Content-Length and abort stalled reads', async () => {
  const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(6)); c.enqueue(new Uint8Array(6)); c.close(); } });
  await assert.rejects(readLimitedBytes(new Response(body), 10));
  await assert.rejects(readLimitedBytes(new Response('x', { headers: { 'content-length': '1000' } }), 10));
  await assert.rejects(readLimitedBytes(new Response(''), 10));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25);
  await assert.rejects(readLimitedBytes(new Response(new ReadableStream()), 10, controller.signal));
  clearTimeout(timer);
  assert.deepEqual([...await readLimitedBytes(new Response('abc'), 10)], [97, 98, 99]);
});

test('Hymn responses reject HTML error pages, failed statuses, empty and malformed JSON', async () => {
  const json = (body: string, status = 200) => new Response(body, { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
  assert.deepEqual(await readLimitedJson(json('[{"id":1}]')), [{ id: 1 }]);
  await assert.rejects(readLimitedJson(new Response('<script>test only</script>', { headers: { 'content-type': 'text/html' } })));
  await assert.rejects(readLimitedJson(json('{}', 500)));
  await assert.rejects(readLimitedJson(json('{invalid')));
  await assert.rejects(readLimitedJson(json('')));
});

test('Cached downloads cannot share/delete other app files or bypass the sandbox with path tricks', () => {
  const item = content.media[0];
  const root = 'file:///data/user/0/com.brightemm001.mountzion/files/mount-zion-media/';
  const fileName = downloadFileName(item, 'mp4');
  const download = { key: `${item.id}:mp4`, mediaId: item.id, format: 'mp4', fileName, uri: root + fileName, bytes: 100, savedAt: '2026-10-01T12:00:00.000Z' };
  assert.equal(isSandboxDownload(download, root), true);
  for (const uri of [root + '../preferences.json', root + '%2e%2e/preferences.json', root + '%2f' + fileName, root + fileName + '?extra',
    root + 'nested/' + fileName, root.replace('/files/', '/secrets/') + fileName, 'https://evil.example/' + fileName]) assert.equal(isSandboxDownload({ ...download, uri }, root), false);
  for (const patch of [{ fileName: '../data.json' }, { key: 'other:mp4' }, { mediaId: 'unknown' }, { bytes: MAX_MEDIA_BYTES + 1 }, { bytes: Infinity }, { savedAt: 'invalid' }]) assert.equal(isDownloadMetadata({ ...download, ...patch }), false);
  assert.deepEqual(parsePreferences({ downloads: [download, download] }).downloads, [download]);
  assert.throws(() => catalogMedia({ ...item, id: 'unknown' }, 'mp4'));
  assert.equal(catalogMedia({ ...item, file: '../../private' }, 'mp4').file, item.file);
  assert.equal(mediaMimeAllowed('text/html', 'mp4'), false);
  assert.equal(mediaMimeAllowed('application/javascript', 'mp3'), false);
  assert.equal(mediaMimeAllowed('video/mp4', 'mp3'), false);
  assert.equal(mediaMimeAllowed('audio/mpeg', 'mp3'), true);
});

test('Patched transitive dependencies retain router decoding and Xcode UUID compatibility', () => {
  const require = createRequire(import.meta.url);
  const queryString = require('query-string');
  assert.equal(queryString.parse('name=%E1%BB%8Cp%E1%BA%B9%CC%81&number=3').name, 'Ọpẹ́');
  assert.equal(queryString.parse('number=3').number, '3');
  const start = performance.now();
  queryString.parse(`value=${'%EA'.repeat(4096)}`);
  assert.ok(performance.now() - start < 1500, 'Malformed percent encoding must not stall the app');
  const project = require('xcode').project('test-only.xcodeproj/project.pbxproj');
  project.hash = { project: { objects: {} } };
  assert.match(project.generateUuid(), /^[A-F0-9]{24}$/);
});
