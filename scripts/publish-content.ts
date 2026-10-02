import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { MAX_CONTENT_BYTES, parseWebsiteContent } from '../src/services/content-data';

async function main() {
const directory = path.resolve(process.argv[2] || 'website-update');
const raw = await readFile('content/app-content.json', 'utf8');
if (Buffer.byteLength(raw) > MAX_CONTENT_BYTES) throw new Error('The content list exceeds the 4 MB limit.');
const content = parseWebsiteContent({ ...JSON.parse(raw), updatedAt: new Date().toISOString() });
const output = JSON.stringify(content, null, 2) + '\n';
if (Buffer.byteLength(output) > MAX_CONTENT_BYTES) throw new Error('The content list exceeds the 4 MB limit.');
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'app-content.json'), output);
console.log(`Ready to publish: ${path.join(directory, 'app-content.json')}`);
console.log('Publish this file at your church website root alongside index.html, then refresh the app.');

}
void main().catch(() => { console.error("Content could not be published. Check the JSON fields, size and output folder, then try again."); process.exitCode = 1; });
