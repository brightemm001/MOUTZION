export type Language = 'en' | 'yo';
export type HymnCollection = 'regular' | 'various';
export type MediaFormat = 'mp3' | 'mp4';
export type MediaCategory = 'sermon' | 'prayer' | 'praise' | 'gathering';

export interface Hymn {
  key: string;
  number: number;
  language: Language;
  collection: HymnCollection;
  title: string;
  category: string;
  scripture: string | null;
  verses: string[];
  chorus: string | null;
}

export interface Devotion {
  title: string;
  reading: string;
  verse: string;
  fire: string;
  message: string[];
  quote: string;
  declaration: string;
  morning: string[];
  evening: string[];
}

export interface DatedDevotion {
  date: string;
  title: Record<Language, string>;
  reading: string;
  memoryRef: string;
  memory: Record<Language, string>;
  fire: string;
  focus: Record<Language, string>;
  message: Record<Language, string[]>;
  quote: Record<Language, string>;
  declaration: Record<Language, string>;
}

export interface PrayerPlan {
  category: string;
  label: Record<Language, string>;
  refs: string[];
  themes: Record<Language, string[]>;
  points: Record<Language, string[]>;
}

export interface MediaItem {
  id: string;
  title: string;
  category: MediaCategory;
  slug: string;
  file: string;
  poster: string;
}

export interface ChurchEvent {
  id: string;
  date: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  time: string;
  location: string;
}

export interface WebsiteContent {
  schemaVersion?: 1;
  updatedAt?: string;
  events?: ChurchEvent[];
  dated: DatedDevotion[];
  rotating: Record<Language, Devotion[]>;
  prayers: PrayerPlan[];
  media: MediaItem[];
  sourceCommit: string;
}

export interface DownloadedMedia {
  key: string;
  mediaId: string;
  format: MediaFormat;
  fileName: string;
  uri: string;
  bytes: number;
  savedAt: string;
}

export interface Preferences {
  language: Language;
  textSize: number;
  hymnFavourites: string[];
  devotionalBookmarks: string[];
  devotionalRead: string[];
  prayerProgress: string[];
  downloads: DownloadedMedia[];
}

export type RootStackParams = {
  Main: { screen?: keyof TabParams } | undefined;
  Hymn: { hymnKey: string };
  Devotional: { date?: string } | undefined;
  Prayers: undefined;
  Player: { mediaId: string; format: MediaFormat };
  Giving: undefined;
  Connect: { kind?: 'prayer' | 'testimony' } | undefined;
  Visit: undefined;
  Saved: undefined;
  Downloads: undefined;
  Settings: undefined;
  Privacy: undefined;
  Sources: undefined;
};

export type TabParams = {
  Home: undefined;
  Hymns: undefined;
  Media: undefined;
  Daily: undefined;
  More: undefined;
};
