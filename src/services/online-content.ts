import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo/fetch';
import { church } from '../config/church';
import { MAX_CONTENT_BYTES, parseWebsiteContent } from './content-data';
import { readLimitedBytes } from './network-limits';
import type { WebsiteContent } from '../types';

// Public read-only content. Keep hosting/payment configuration outside this document.
export const CONTENT_URL = `${church.website}/app-content.json`;
const CACHE = 'mount-zion.content.v1';
export async function readContentCache(): Promise<WebsiteContent | null> {
  const raw = await AsyncStorage.getItem(CACHE);
  if (!raw) return null;
  if (raw.length > MAX_CONTENT_BYTES || new TextEncoder().encode(raw).length > MAX_CONTENT_BYTES) throw new Error('Saved content is too large.');
  return parseWebsiteContent(JSON.parse(raw));
}
export async function fetchContent(): Promise<WebsiteContent> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const requestUrl = `${CONTENT_URL}?v=${Date.now()}`;
    const response = await fetch(requestUrl, { signal: controller.signal, credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' } });
    if (response.url !== requestUrl || !/^application\/(?:json|[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error('Content is unavailable.');
    }
    const bytes = await readLimitedBytes(response, MAX_CONTENT_BYTES, controller.signal);
    return parseWebsiteContent(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } finally { clearTimeout(timer); }
}
export async function saveContentCache(value: WebsiteContent): Promise<boolean> {
  try { await AsyncStorage.setItem(CACHE, JSON.stringify(value)); return true; } catch { return false; }
}
