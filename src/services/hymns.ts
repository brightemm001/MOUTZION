import AsyncStorage from '@react-native-async-storage/async-storage';
import { church } from '../config/church';
import type { Hymn } from '../types';
import { fetch } from 'expo/fetch';
import { parseCollection, validateCompleteBooks } from './hymn-data';
import { CHUNK_SIZE, HYMN_CACHE as CACHE, MAX_CACHE_BYTES, MAX_CHUNK_BYTES, parseCachedBooks, parseManifest } from './hymn-cache';
import { readLimitedJson } from './network-limits';
export { filterHymns, normaliseSearch, parseCollection } from './hymn-data';

export async function readHymnCache(): Promise<{ hymns: Hymn[]; savedAt: string } | null> {
  const raw = await AsyncStorage.getItem(`${CACHE}.manifest`);
  const manifest = parseManifest(raw);
  if (!manifest) return null;
  const values = await AsyncStorage.multiGet(Array.from({ length: manifest.chunks }, (_, i) => `${CACHE}.${manifest.generation}.${i}`));
  const hymns = parseCachedBooks(values.map(([, value]) => value), manifest);
  return hymns ? { hymns, savedAt: manifest.savedAt } : null;
}

async function writeHymnCache(hymns: Hymn[]): Promise<string> {
  if (!validateCompleteBooks(hymns)) throw new Error('The hymn books are incomplete.');
  const previous = await AsyncStorage.getItem(`${CACHE}.manifest`);
  const generation = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const chunks: [string, string][] = [];
  for (let i = 0; i < hymns.length; i += CHUNK_SIZE) chunks.push([`${CACHE}.${generation}.${chunks.length}`, JSON.stringify(hymns.slice(i, i + CHUNK_SIZE))]);
  const sizes = chunks.map(([, raw]) => new TextEncoder().encode(raw).byteLength);
  if (sizes.some(size => size > MAX_CHUNK_BYTES) || sizes.reduce((sum, size) => sum + size, 0) > MAX_CACHE_BYTES) throw new Error('The hymn cache is too large.');
  const savedAt = new Date().toISOString();
  try {
    await AsyncStorage.multiSet(chunks);
    await AsyncStorage.setItem(`${CACHE}.manifest`, JSON.stringify({ generation, chunks: chunks.length, count: hymns.length, savedAt }));
  } catch (error) {
    // Clean up a partial write while leaving the previous manifest and its hymns intact.
    await AsyncStorage.multiRemove(chunks.map(([key]) => key)).catch(() => undefined);
    throw error;
  }
  // Publish the new manifest before removing the previous generation, so an interrupted refresh preserves usable data.
  if (previous) {
    try {
      const old = parseManifest(previous);
      if (old) await AsyncStorage.multiRemove(Array.from({ length: old.chunks }, (_, i) => `${CACHE}.${old.generation}.${i}`));
    } catch { /* A stale generation can be removed on a later successful refresh. */ }
  }
  return savedAt;
}

export async function fetchHymns(): Promise<{ hymns: Hymn[]; savedAt: string | null }> {
  const collections = (['en', 'yo'] as const).flatMap(language =>
    (['regular', 'various'] as const).map(collection => ({ language, collection })),
  );
  const groups = await Promise.all(collections.map(async ({ language, collection }) => {
    const sourceLanguage = language === 'en' ? 'english' : 'yoruba';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const url = `${church.hymnApi}/collections/${encodeURIComponent(`cac/${sourceLanguage}/${collection}`)}`;
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' }, credentials: 'omit', redirect: 'error' });
      if (response.url !== url) throw new Error('The hymn service redirected unexpectedly.');
      return parseCollection(await readLimitedJson(response, controller.signal), language, collection);
    } finally { clearTimeout(timeout); }
  }));
  const hymns = groups.flat();
  if (!validateCompleteBooks(hymns)) throw new Error('The hymn books are incomplete.');
  try { return { hymns, savedAt: await writeHymnCache(hymns) }; }
  catch { return { hymns, savedAt: null }; }
}
