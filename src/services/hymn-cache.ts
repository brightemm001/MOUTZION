import type { Hymn } from '../types';
import { validateCompleteBooks } from './hymn-data';

export const HYMN_CACHE = 'mount-zion.hymns.v1';
export const CHUNK_SIZE = 60;
export const MAX_CACHE_BYTES = 2 * 1024 * 1024;
export const MAX_CHUNK_BYTES = 512 * 1024;
export interface CacheManifest { generation: string; chunks: number; count: number; savedAt: string }

export function parseManifest(raw: string | null): CacheManifest | null {
  if (!raw || raw.length > 1024) return null;
  try {
    const m = JSON.parse(raw) as Partial<CacheManifest>;
    if (!m || typeof m !== 'object' || typeof m.generation !== 'string' || !/^\d{13}-[a-z0-9]{1,8}$/.test(m.generation)
      || m.chunks !== 35 || m.count !== 2100 || typeof m.savedAt !== 'string'
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(m.savedAt) || Number.isNaN(Date.parse(m.savedAt))) return null;
    return m as CacheManifest;
  } catch { return null; }
}

export function parseCachedBooks(values: (string | null)[], manifest: CacheManifest): Hymn[] | null {
  if (values.length !== manifest.chunks) return null;
  let bytes = 0;
  const hymns: unknown[] = [];
  try {
    for (const raw of values) {
      if (!raw || raw.length > MAX_CHUNK_BYTES) return null;
      const size = new TextEncoder().encode(raw).byteLength;
      bytes += size;
      if (size > MAX_CHUNK_BYTES || bytes > MAX_CACHE_BYTES) return null;
      const chunk: unknown = JSON.parse(raw);
      if (!Array.isArray(chunk) || chunk.length !== CHUNK_SIZE) return null;
      hymns.push(...chunk);
    }
    return validateCompleteBooks(hymns) ? hymns : null;
  } catch { return null; }
}
