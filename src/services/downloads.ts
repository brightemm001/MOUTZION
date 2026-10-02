import { Platform } from 'react-native';
import { fetch } from 'expo/fetch';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { church } from '../config/church';
import type { DownloadedMedia, MediaFormat, MediaItem } from '../types';
import { catalogMedia, downloadFileName, isSandboxDownload, MAX_DOWNLOAD_MS, MAX_MEDIA_BYTES, mediaMimeAllowed } from './media-policy';
import { readLimitedBytes } from './network-limits';

export const mediaUrl = (item: MediaItem, format: MediaFormat) => `${church.website}/media/sermons/${encodeURIComponent(catalogMedia(item, format).file)}.${format}`;
const directory = () => {
  if (!FileSystem.documentDirectory) throw new Error('Device storage is unavailable.');
  return `${FileSystem.documentDirectory}mount-zion-media/`;
};

export interface DownloadJob {
  result: Promise<DownloadedMedia | null>;
  cancel: () => Promise<void>;
}

export function startDownload(item: MediaItem, format: MediaFormat, progress: (ratio: number) => void): DownloadJob {
  const known = catalogMedia(item, format);
  const fileName = downloadFileName(known, format);
  const key = `${known.id}:${format}`;
  const url = mediaUrl(known, format);
  const controller = new AbortController();
  if (Platform.OS === 'web') {
    const timeout = setTimeout(() => controller.abort(), MAX_DOWNLOAD_MS);
    const result = (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, credentials: 'omit', redirect: 'error' });
        if (response.url !== url || !mediaMimeAllowed(response.headers.get('content-type'), format)) {
          await response.body?.cancel().catch(() => undefined);
          throw new Error('This download is unavailable. Please try again.');
        }
        const bytes = await readLimitedBytes(response, MAX_MEDIA_BYTES, controller.signal, (received, expected) => { if (expected > 0) progress(received / expected); });
        const blob = new Blob([bytes], { type: format === 'mp3' ? 'audio/mpeg' : 'video/mp4' });
        progress(1);
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        return null;
      } finally { clearTimeout(timeout); }
    })();
    return { result, cancel: async () => controller.abort() };
  }

  let active: FileSystem.DownloadResumable | null = null;
  let cancelled = false;
  let interrupt!: (error: Error) => void;
  const stopped = new Promise<never>((_, reject) => { interrupt = reject; });
  // The preflight may still be in progress when cancellation happens.
  void stopped.catch(() => undefined);
  const stop = (error: Error) => { controller.abort(); interrupt(error); };
  const root = directory();
  const uri = root + fileName;
  const timeout = setTimeout(() => stop(new Error('The download timed out.')), MAX_DOWNLOAD_MS);
  const result = (async () => {
    let completed = false;
    try {
      await FileSystem.makeDirectoryAsync(root, { intermediates: true });
      if (cancelled) return null;
      // Check type, declared size and redirects before writing a file. The actual
      // transfer is also bounded by progress callbacks and the final file size.
      const headTimeout = setTimeout(() => stop(new Error('The media service timed out.')), 20000);
      try {
        const head = await fetch(url, { method: 'HEAD', signal: controller.signal, credentials: 'omit', redirect: 'error' });
        if (!head.ok || head.url !== url || !mediaMimeAllowed(head.headers.get('content-type'), format)
          || Number(head.headers.get('content-length')) > MAX_MEDIA_BYTES) throw new Error('The recording is unavailable or too large.');
      } finally { clearTimeout(headTimeout); }
      if (cancelled) return null;
      if (controller.signal.aborted) throw new Error('The download was interrupted.');
      active = FileSystem.createDownloadResumable(url, uri, {}, data => {
        if (data.totalBytesWritten > MAX_MEDIA_BYTES || data.totalBytesExpectedToWrite > MAX_MEDIA_BYTES) {
          stop(new Error('The recording exceeds the download limit.'));
        } else if (data.totalBytesExpectedToWrite > 0) progress(data.totalBytesWritten / data.totalBytesExpectedToWrite);
      });
      const done = await Promise.race([active.downloadAsync(), stopped]);
      if (cancelled) return null;
      if (!done || done.status !== 200 || !mediaMimeAllowed(done.headers['Content-Type'] || done.headers['content-type'], format)) throw new Error('The media file could not be downloaded.');
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists || !info.size || info.size > MAX_MEDIA_BYTES) throw new Error('The downloaded media file is invalid.');
      completed = true;
      return { key, mediaId: known.id, format, fileName, uri, bytes: info.size, savedAt: new Date().toISOString() };
    } catch (error) {
      if (cancelled) return null;
      throw error;
    } finally {
      clearTimeout(timeout);
      if (!completed) {
        await active?.pauseAsync().catch(() => undefined);
        await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
      }
    }
  })();
  return {
    result,
    cancel: async () => { cancelled = true; stop(new Error('Download cancelled.')); },
  };
}

export async function validDownload(download: DownloadedMedia): Promise<boolean> {
  if (Platform.OS === 'web' || !isSandboxDownload(download, directory())) return false;
  const info = await FileSystem.getInfoAsync(download.uri);
  return info.exists && info.size === download.bytes && info.size > 0 && info.size <= MAX_MEDIA_BYTES;
}

export async function exportDownload(download: DownloadedMedia): Promise<void> {
  if (!await validDownload(download)) throw new Error('This file is no longer on your device. Download it again.');
  if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
  await Sharing.shareAsync(download.uri, { mimeType: download.format === 'mp3' ? 'audio/mpeg' : 'video/mp4', dialogTitle: download.fileName });
}

export async function deleteDownload(download: DownloadedMedia): Promise<void> {
  if (Platform.OS !== 'web' && isSandboxDownload(download, directory())) await FileSystem.deleteAsync(download.uri, { idempotent: true });
}
