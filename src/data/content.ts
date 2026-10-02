import snapshot from './website.json';
import type { Devotion, Language, WebsiteContent } from '../types';

// This live binding is shared with download/catalog validation; React gets its snapshot from AppState.
export let content: WebsiteContent = { ...snapshot, events: [] } as WebsiteContent;
export function replaceContent(next: WebsiteContent): void { content = next; }

export function lagosDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (key: string) => parts.find(p => p.type === key)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function dateLabel(key: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(`${key}T12:00:00Z`));
}

export function shiftDate(key: string, delta: number): string {
  return new Date(Date.parse(`${key}T12:00:00Z`) + delta * 86400000).toISOString().slice(0, 10);
}

export function getDevotion(key: string, language: Language, source: WebsiteContent = content): Devotion {
  const entry = source.dated.find(d => d.date === key);
  if (!entry) {
    const choices = source.rotating[language];
    const index = ((Math.floor(Date.parse(`${key}T00:00:00Z`) / 86400000) % choices.length) + choices.length) % choices.length;
    return choices[index];
  }
  const focus = entry.focus[language];
  const morning = language === 'en' ? [
    "Father, establish {focus} in my life today, in Jesus' name.",
    "Remove every hindrance to {focus} from my path, in Jesus' name.",
    'Show me one faithful step I can take in {focus} today.',
  ] : [
    'Baba, fi {focus} múlẹ̀ nínú ìgbésí ayé mi lónìí, ní orúkọ Jésù.',
    'Yọ gbogbo ìdènà sí {focus} kúrò ní ọ̀nà mi, ní orúkọ Jésù.',
    'Fi ìgbésẹ̀ ìgbọ́ràn kan tí mo lè gbé nípa {focus} hàn mí, ní orúkọ Jésù.',
  ];
  const evening = language === 'en' ? [
    'Father, thank You for Your help with {focus} today.',
    'Forgive me where I acted without faith or wisdom, and guide me to make things right.',
    "Keep {focus} in Your care and renew my strength for tomorrow, in Jesus' name.",
  ] : [
    'Baba, mo dúpẹ́ fún ìrànlọ́wọ́ Rẹ nípa {focus} lónìí.',
    'Dárí jì mí níbi tí mo ti hùwà láìní ìgbàgbọ́ tàbí ọgbọ́n; ràn mí lọ́wọ́ láti ṣe àtúnṣe.',
    'Pa {focus} mọ́ sínú àbójútó Rẹ, kí O sì tún agbára mi ṣe fún ọ̀la, ní orúkọ Jésù.',
  ];
  return {
    title: entry.title[language], reading: entry.reading,
    verse: `${entry.memoryRef} - ${entry.memory[language]}`, fire: entry.fire,
    message: entry.message[language], quote: entry.quote[language], declaration: entry.declaration[language],
    morning: morning.map(t => t.replaceAll('{focus}', focus)),
    evening: evening.map(t => t.replaceAll('{focus}', focus)),
  };
}
