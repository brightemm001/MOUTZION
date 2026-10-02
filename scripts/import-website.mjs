import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readLiteralData } from './literal-data.mjs';
import { parseWebsiteContent, MAX_CONTENT_BYTES } from '../src/services/content-data.ts';

const website = path.resolve(process.argv[2] || '../source-website');
const output = path.resolve('src/data');

async function declaration(file, name) {
  if ((await fs.stat(path.join(website, file))).size > 8 * 1024 * 1024) throw new Error('Website data source is too large.');
  const source = await fs.readFile(path.join(website, file), 'utf8');
  return readLiteralData(source, name);
}

async function windowData(file, name) {
  if ((await fs.stat(path.join(website, file))).size > 8 * 1024 * 1024) throw new Error('Website data source is too large.');
  const source = await fs.readFile(path.join(website, file), 'utf8');
  return readLiteralData(source, name, true);
}

const dated = await windowData('devotional-oct-2026.js', 'octoberDevotions');
const rotatingEnglish = await declaration('devotional.js', 'devotions');
const rotatingYoruba = await declaration('devotional-yo.js', 'devotionsYoruba');
const englishPrayers = await declaration('prayers.js', 'plans');
const yorubaPrayers = await windowData('prayers-yo.js', 'mountZionPrayerYoruba');
const media = await declaration('sermon-library.js', 'mediaItems');
const prayers = Object.entries(englishPrayers).map(([category, plan]) => ({
  category,
  label: { en: category, yo: yorubaPrayers.categories[category] },
  refs: plan.ref,
  themes: { en: plan.themes, yo: yorubaPrayers.themes[category] },
  points: {
    en: plan.points,
    yo: yorubaPrayers.points.map(text => text.replaceAll('{focus}', yorubaPrayers.focus[category])),
  },
}));

for (const item of media) {
  if (!/^[a-z0-9_-]{1,100}$/.test(item.file) || !/^[a-z0-9-]{1,100}$/.test(item.slug)) throw new Error('Invalid media filename.');
  for (const format of ['mp3', 'mp4']) await fs.access(path.join(website, 'media/sermons', `${item.file}.${format}`));
}
const sourceCommit = execFileSync('git', ['-C', website, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
await fs.mkdir(output, { recursive: true });
await fs.writeFile(path.join(output, 'website.json'), JSON.stringify({
  dated,
  rotating: { en: rotatingEnglish, yo: rotatingYoruba },
  prayers,
  media: media.map(item => ({ ...item, id: item.slug, poster: path.basename(item.poster, '.jpg') })),
  sourceCommit,
}, null, 2) + '\n');

await fs.mkdir('assets/church', { recursive: true });
await fs.copyFile(path.join(website, 'assets/logo.png'), 'assets/logo.png');
for (const file of await fs.readdir(path.join(website, 'assets'))) {
  if (file.endsWith('.jpg')) await fs.copyFile(path.join(website, 'assets', file), path.join('assets/church', file));
}
console.log(`Imported ${dated.length} dated devotionals, ${prayers.length} bilingual prayer plans, ${media.length} media items, and original church images.`);

// Publishing content does not require an APK rebuild. Validate before writing the public feed.
const imported = JSON.parse(await fs.readFile(path.join(output, 'website.json'), 'utf8'));
let events = [];
let previousDated = [];
try {
  const previousRaw = await fs.readFile(path.join(website, 'app-content.json'), 'utf8');
  if (Buffer.byteLength(previousRaw) > MAX_CONTENT_BYTES) throw new Error('Previous feed is too large.');
  const previous = parseWebsiteContent(JSON.parse(previousRaw));
  events = previous.events || [];
  previousDated = previous.dated;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  // A first publication has no scheduled events.
}
const mergedDated = [...new Map([...previousDated, ...imported.dated].map(entry => [entry.date, entry])).values()];
const feed = parseWebsiteContent({ ...imported, dated: mergedDated, schemaVersion: 1, updatedAt: new Date().toISOString(), events });
const feedJson = JSON.stringify(feed, null, 2) + '\n';
if (Buffer.byteLength(feedJson) > MAX_CONTENT_BYTES) throw new Error('The content feed exceeds the 4 MB limit.');
await fs.mkdir('content', { recursive: true });
await fs.writeFile('content/app-content.json', feedJson);
await fs.writeFile(path.join(website, 'app-content.json'), feedJson);
console.log('Updated app-content.json in the website. Commit and push the website to publish to installed apps.');
