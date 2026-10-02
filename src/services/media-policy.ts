import { content } from '../data/content';
import type { DownloadedMedia, MediaFormat, MediaItem } from '../types';

export const MAX_MEDIA_BYTES = 200 * 1024 * 1024;
export const MAX_DOWNLOAD_MS = 5 * 60 * 1000;

export function catalogMedia(item: MediaItem, format: MediaFormat): MediaItem {
  const known = content.media.find(entry => entry.id === item?.id);
  if (!known || (format !== 'mp3' && format !== 'mp4') || !/^[a-z0-9_-]{1,100}$/.test(known.file)
    || !/^[a-z0-9-]{1,100}$/.test(known.slug)) throw new Error('This recording is unavailable.');
  return known;
}

export const downloadFileName = (item: MediaItem, format: MediaFormat) => `mount-zion-${catalogMedia(item, format).slug}.${format}`;

export function isDownloadMetadata(value: unknown): value is DownloadedMedia {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const d = value as Partial<DownloadedMedia>;
  const item = content.media.find(entry => entry.id === d.mediaId);
  if (!item || (d.format !== 'mp3' && d.format !== 'mp4')) return false;
  return d.key === `${item.id}:${d.format}` && d.fileName === downloadFileName(item, d.format)
    && typeof d.uri === 'string' && d.uri.length <= 2048 && d.uri.startsWith('file:///')
    && !/[%?#\\\u0000-\u001f]/.test(d.uri) && !d.uri.split('/').some(part => part === '.' || part === '..')
    && d.uri.endsWith(`/mount-zion-media/${d.fileName}`)
    && typeof d.bytes === 'number' && Number.isSafeInteger(d.bytes) && d.bytes > 0 && d.bytes <= MAX_MEDIA_BYTES
    && typeof d.savedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(d.savedAt) && !Number.isNaN(Date.parse(d.savedAt));
}

/** Equality to one catalog filename in the current app sandbox prevents prefix/traversal bypasses. */
export function isSandboxDownload(value: unknown, root: string): value is DownloadedMedia {
  return isDownloadMetadata(value) && root.startsWith('file:///') && root.endsWith('/mount-zion-media/') && value.uri === root + value.fileName;
}

export function mediaMimeAllowed(value: string | null, format: MediaFormat): boolean {
  const mime = (value || '').split(';')[0].trim().toLowerCase();
  return mime === 'application/octet-stream' || (format === 'mp3' ? mime === 'audio/mpeg' || mime === 'audio/mp3' : mime === 'video/mp4');
}
