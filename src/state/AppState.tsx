import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import type { DownloadedMedia, Hymn, MediaFormat, MediaItem, Preferences, WebsiteContent } from '../types';
import { fetchHymns, readHymnCache } from '../services/hymns';
import { deleteDownload, startDownload, validDownload, type DownloadJob } from '../services/downloads';
import { content, lagosDateKey, replaceContent } from '../data/content';
import { fetchContent, readContentCache, saveContentCache } from '../services/online-content';
import { defaultPreferences as defaults, MAX_PREFERENCES_LENGTH, parsePreferences } from '../services/preferences';

const STORAGE = 'mount-zion.preferences.v1';
type ToggleField = 'hymnFavourites' | 'devotionalBookmarks' | 'devotionalRead' | 'prayerProgress';
interface StateValue {
  content: WebsiteContent;
  contentBusy: boolean;
  contentError: string | null;
  contentSavedAt: string | null;
  refreshContent: () => Promise<void>;
  preferences: Preferences;
  ready: boolean;
  today: string;
  notice: string | null;
  notify: (message: string) => void;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  toggle: (field: ToggleField, key: string) => void;
  hymns: Hymn[];
  hymnsBusy: boolean;
  hymnsError: string | null;
  hymnsSavedAt: string | null;
  loadHymns: (refresh?: boolean) => Promise<void>;
  download: (item: MediaItem, format: MediaFormat) => Promise<void>;
  activeDownload: { key: string; title: string; progress: number } | null;
  cancelDownload: () => Promise<void>;
  removeDownload: (item: DownloadedMedia) => Promise<void>;
}

const Context = createContext<StateValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [contentData, setContentData] = useState<WebsiteContent>(content);
  const [contentBusy, setContentBusy] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentSavedAt, setContentSavedAt] = useState<string | null>(null);
  const contentJob = useRef<Promise<void> | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const refreshContent = useCallback((): Promise<void> => {
    if (contentJob.current) return contentJob.current;
    setContentBusy(true);
    setContentError(null);
    contentJob.current = (async () => {
      try {
        const latest = await fetchContent();
        if (!alive.current) return;
        const saved = await saveContentCache(latest);
        if (!alive.current) return;
        replaceContent(latest);
        setContentData(latest);
        if (saved) setContentSavedAt(latest.updatedAt || null);
        else { setContentSavedAt(null); setContentError('New content loaded, but it could not be saved for offline use.'); }
      } catch {
        if (alive.current) setContentError('Could not check for new content. Your available readings and recordings are still here. Try again when connected.');
      }
    })().finally(() => { contentJob.current = null; if (alive.current) setContentBusy(false); });
    return contentJob.current;
  }, []);
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [today, setToday] = useState(lagosDateKey);
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [hymnsBusy, setHymnsBusy] = useState(false);
  const [hymnsError, setHymnsError] = useState<string | null>(null);
  const [hymnsSavedAt, setHymnsSavedAt] = useState<string | null>(null);
  const [activeDownload, setActiveDownload] = useState<StateValue['activeDownload']>(null);
  const hymnJob = useRef<Promise<void> | null>(null);
  const hymnsRef = useRef<Hymn[]>([]);
  const downloadJob = useRef<DownloadJob | null>(null);
  const downloadStarting = useRef(false);
  const downloadCancelled = useRef(false);
  const persistence = useRef<Promise<unknown>>(Promise.resolve());
  const notify = useCallback((message: string) => setNotice(message), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        try {
          const cached = await readContentCache();
          if (cached && mounted) { replaceContent(cached); setContentData(cached); setContentSavedAt(cached.updatedAt || null); }
        } catch { /* The bundled content remains available if the cache is damaged. */ }
        const raw = await AsyncStorage.getItem(STORAGE);
        if (raw && raw.length > MAX_PREFERENCES_LENGTH) throw new Error('Saved preferences are too large.');
        const loaded = raw ? parsePreferences(JSON.parse(raw)) : defaults;
        const downloads = [];
        for (const download of loaded.downloads) if (await validDownload(download).catch(() => false)) downloads.push(download);
        if (mounted) setPreferences({ ...loaded, downloads });
      } catch { if (mounted) notify('Saved preferences could not be loaded. You can still use the app.'); }
      finally { if (mounted) setReady(true); }
    })();
    const timer = setInterval(() => setToday(lagosDateKey()), 30000);
    return () => { mounted = false; clearInterval(timer); };
  }, [notify]);

  useEffect(() => {
    if (!ready) return;
    persistence.current = persistence.current.then(() => AsyncStorage.setItem(STORAGE, JSON.stringify(preferences)))
      .catch(() => notify('Your changes could not be saved on this device. Please try again.'));
  }, [preferences, ready, notify]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!ready) return;
    void refreshContent();
    const timer = setInterval(() => { if (AppState.currentState === 'active' || Platform.OS === 'web') void refreshContent(); }, 5 * 60 * 1000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refreshContent(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [ready, refreshContent]);

  const setPreference: StateValue['setPreference'] = useCallback((key, value) => {
    setPreferences(previous => ({ ...previous, [key]: value }));
  }, []);

  const toggle = useCallback((field: ToggleField, key: string) => {
    setPreferences(previous => ({ ...previous, [field]: previous[field].includes(key) ? previous[field].filter(x => x !== key) : [...previous[field], key] }));
  }, []);

  const loadHymns = useCallback((refresh = false): Promise<void> => {
    if (hymnJob.current) return hymnJob.current;
    if (!refresh && hymnsRef.current.length) return Promise.resolve();
    setHymnsBusy(true);
    setHymnsError(null);
    hymnJob.current = (async () => {
      if (!refresh) {
        try {
          const cached = await readHymnCache();
          if (cached) {
            hymnsRef.current = cached.hymns;
            setHymns(cached.hymns);
            setHymnsSavedAt(cached.savedAt);
            return;
          }
        } catch { /* Fetch a fresh collection if the local cache is damaged. */ }
      }
      try {
        const result = await fetchHymns();
        hymnsRef.current = result.hymns;
        setHymns(result.hymns);
        setHymnsSavedAt(result.savedAt);
        if (!result.savedAt) setHymnsError('The hymns loaded, but offline storage failed. Try refreshing when device storage is available.');
      } catch {
        setHymnsError(hymnsRef.current.length ? 'Could not refresh. Your saved hymns are still available.' : 'Connect to the internet to download the hymn books. After the first download, you can read and search offline.');
      }
    })().finally(() => { hymnJob.current = null; setHymnsBusy(false); });
    return hymnJob.current;
  }, []);

  const download = useCallback(async (item: MediaItem, format: MediaFormat) => {
    if (downloadStarting.current) { notify('Another download is in progress. Wait for it or cancel it first.'); return; }
    downloadStarting.current = true;
    downloadCancelled.current = false;
    try {
      const key = `${item.id}:${format}`;
      const saved = preferences.downloads.find(d => d.key === key);
      if (saved && await validDownload(saved)) { notify('Already saved. Open Downloads to play or share this file.'); return; }
      setActiveDownload({ key, title: item.title, progress: 0 });
      const job = startDownload(item, format, progress => setActiveDownload(current => current ? { ...current, progress: Math.min(1, Math.max(0, progress)) } : current));
      downloadJob.current = job;
      const result = await job.result;
      if (result) {
        setPreferences(current => ({ ...current, downloads: [...current.downloads.filter(d => d.key !== result.key), result] }));
        notify('Saved for offline playback. Find it in Downloads.');
      } else if (Platform.OS === 'web' && !downloadCancelled.current) notify('Download sent to your browser.');
    } catch { if (!downloadCancelled.current) notify('The download failed. Check your connection and try again.'); }
    finally { downloadJob.current = null; downloadStarting.current = false; setActiveDownload(null); }
  }, [preferences.downloads, notify]);

  const cancelDownload = useCallback(async () => {
    downloadCancelled.current = true;
    await downloadJob.current?.cancel();
    notify('Download cancelled.');
  }, [notify]);

  const removeDownload = useCallback(async (item: DownloadedMedia) => {
    await deleteDownload(item);
    setPreferences(current => ({ ...current, downloads: current.downloads.filter(d => d.key !== item.key) }));
    notify('Removed from this device.');
  }, [notify]);

  return <Context.Provider value={{ content: contentData, contentBusy, contentError, contentSavedAt, refreshContent, preferences, ready, today, notice, notify, setPreference, toggle, hymns, hymnsBusy, hymnsError, hymnsSavedAt, loadHymns, download, activeDownload, cancelDownload, removeDownload }}>{children}</Context.Provider>;
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('AppProvider is required.');
  return value;
}

export function useContent(): WebsiteContent { return useApp().content; }
