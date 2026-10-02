import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { ArrowLeft, ArrowRight, CloudDownload, Minus, Music2, Plus, RefreshCw, Star } from 'lucide-react-native';
import { useAppNavigation } from '../navigation';
import { Body, Button, Empty, Heading, IconButton, LanguagePicker, Loading, Screen, SearchField, TextTabs, styles } from '../components/ui';
import { Text } from '../components/Text';
import { useApp } from '../state/AppState';
import { filterHymns } from '../services/hymns';
import { colors, serif } from '../theme';
import type { Hymn, HymnCollection } from '../types';

export function HymnRow({ hymn, onPress }: { hymn: Hymn; onPress: () => void }) {
  const { preferences, toggle } = useApp();
  const saved = preferences.hymnFavourites.includes(hymn.key);
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomColor: colors.line, borderBottomWidth: 1 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Hymn ${hymn.number}: ${hymn.title}`} onPress={onPress}
      style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, opacity: pressed ? 0.65 : 1 })}>
      <View style={{ width: 45, height: 45, backgroundColor: colors.brandSoft, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14, fontWeight: '700', color: colors.brand }}>{hymn.number}</Text></View>
      <View style={{ flex: 1, gap: 4 }}><Text numberOfLines={2} style={{ color: colors.ink, fontSize: 15, fontWeight: '600', lineHeight: 22 }}>{hymn.title}</Text><Text style={[styles.muted, { fontSize: 11, lineHeight: 17 }]}>{hymn.verses.length} {hymn.language === 'yo' ? 'ẹsẹ' : hymn.verses.length === 1 ? 'verse' : 'verses'} · {hymn.language === 'yo' ? 'Yoruba' : 'English'}</Text></View>
    </Pressable>
    <IconButton icon={Star} label={saved ? `Remove hymn ${hymn.number} from favourites` : `Save hymn ${hymn.number} to favourites`} active={saved} onPress={() => toggle('hymnFavourites', hymn.key)} />
  </View>;
}

export function HymnsScreen() {
  const navigation = useAppNavigation();
  const { preferences, hymns, hymnsBusy, hymnsError, hymnsSavedAt, loadHymns } = useApp();
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState<HymnCollection>('regular');
  const [mode, setMode] = useState<'all' | 'favourites'>('all');
  useEffect(() => { void loadHymns(); }, [loadHymns]);
  const filtered = useMemo(() => filterHymns(hymns, query, preferences.language, collection, mode === 'favourites' ? new Set(preferences.hymnFavourites) : undefined), [hymns, query, preferences.language, preferences.hymnFavourites, collection, mode]);

  return <Screen scroll={false}>
    <View style={[styles.content, { paddingBottom: 4, gap: 16 }]}>
      <View style={styles.between}><Heading title="Hymns" subtitle="Songs of faith, wherever you are." /><IconButton icon={RefreshCw} label="Refresh hymn books" disabled={hymnsBusy} onPress={() => loadHymns(true)} /></View>
      <View style={[styles.between, { flexWrap: 'wrap', gap: 8 }]}><LanguagePicker />{hymnsSavedAt && <View style={[styles.row, { gap: 5 }]}><CloudDownload size={13} color={colors.green} /><Text style={{ color: colors.green, fontSize: 10 }}>Available offline</Text></View>}</View>
      <SearchField value={query} onChange={setQuery} placeholder="Search number, title, or lyrics" />
      <View style={styles.between}><View style={{ flex: 1 }}><TextTabs items={[{ value: 'all', label: 'All hymns' }, { value: 'favourites', label: 'Favourites' }]} value={mode} onChange={setMode} /></View><Text style={[styles.muted, { fontSize: 12 }]}>{filtered.length.toLocaleString()}</Text></View>
      <View style={[styles.between, { flexWrap: 'wrap', gap: 4 }]}><Text style={[styles.kicker, { fontSize: 8, letterSpacing: 1 }]}>CAC HYMN BOOK</Text><View style={{ flexDirection: 'row', gap: 6 }}>{([{ value: 'regular', label: 'Hymn book' }, { value: 'various', label: 'Additional hymns' }] as { value: HymnCollection; label: string }[]).map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={item.label} aria-pressed={collection === item.value} accessibilityState={{ selected: collection === item.value }} onPress={() => setCollection(item.value)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={{ fontSize: 10, fontWeight: '600', color: collection === item.value ? colors.brand : colors.muted }}>{item.label}</Text></Pressable>)}</View></View>
      {hymnsError && <View style={{ gap: 8 }}><Body muted>{hymnsError}</Body><Button label="Try again" variant="outline" onPress={() => loadHymns(true)} /></View>}
    </View>
    {hymnsBusy && !hymns.length ? <Loading text="Downloading the English and Yoruba hymn books..." /> : <FlatList data={filtered} keyExtractor={h => h.key}
      initialNumToRender={16} maxToRenderPerBatch={18} windowSize={7} keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30, width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1 }}
      renderItem={({ item }) => <HymnRow hymn={item} onPress={() => navigation.navigate('Hymn', { hymnKey: item.key })} />}
      ListEmptyComponent={!hymnsError ? <Empty icon={Music2} title={mode === 'favourites' ? 'No favourites here yet' : 'No matching hymns'} description={mode === 'favourites' ? 'Save a hymn using its star to keep it here.' : 'Try a different hymn number or a few words from the song.'} /> : null}
    />}
  </Screen>;
}

export function HymnDetailScreen({ hymnKey }: { hymnKey: string }) {
  const navigation = useAppNavigation();
  const { preferences, hymns, hymnsBusy, hymnsError, loadHymns, toggle, setPreference } = useApp();
  useEffect(() => { void loadHymns(); }, [loadHymns]);
  const original = hymns.find(h => h.key === hymnKey);
  const hymn = original && hymns.find(h => h.number === original.number && h.collection === original.collection && h.language === preferences.language);
  if (hymnsBusy && !original) return <Screen><Loading text="Loading hymn..." /></Screen>;
  if (!original) return <Screen><Empty icon={Music2} title="Hymn unavailable" description={hymnsError || 'This hymn could not be found in the current collection.'} action={<Button label="Try again" onPress={() => loadHymns(true)} />} /></Screen>;
  const saved = hymn ? preferences.hymnFavourites.includes(hymn.key) : false;
  const sameBook = hymns.filter(h => h.language === preferences.language && h.collection === original.collection);
  const index = hymn ? sameBook.findIndex(h => h.key === hymn.key) : -1;

  return <Screen>
    <View style={styles.between}><Text style={styles.kicker}>CAC {original.collection === 'regular' ? 'hymn' : 'additional hymn'} {original.number}</Text>
      <IconButton icon={Star} label={saved ? 'Remove from favourites' : 'Save to favourites'} active={saved} disabled={!hymn} onPress={() => hymn && toggle('hymnFavourites', hymn.key)} />
    </View>
    <LanguagePicker />
    {!hymn ? <Empty icon={Music2} title="Translation unavailable" description="This hymn is not in the selected language. Switch languages to read the available version." /> : <>
      <Heading title={hymn.title} />
      <View style={styles.between}><Body muted>{hymn.category}</Body><View style={[styles.row, { gap: 0 }]}><IconButton icon={Minus} label="Decrease reading text size" disabled={preferences.textSize <= 16} onPress={() => setPreference('textSize', Math.max(16, preferences.textSize - 2))} /><Text style={styles.muted}>Aa</Text><IconButton icon={Plus} label="Increase reading text size" disabled={preferences.textSize >= 26} onPress={() => setPreference('textSize', Math.min(26, preferences.textSize + 2))} /></View></View>
      {hymn.scripture && <Body muted>{hymn.scripture}</Body>}
      {hymn.verses.map((verse, i) => <View key={i} style={{ gap: 12, paddingVertical: 8 }}><Text style={[styles.kicker, { color: colors.muted }]}>0{i + 1}</Text><Text selectable style={{ color: colors.ink, fontFamily: serif, fontSize: preferences.textSize + 1, lineHeight: (preferences.textSize + 1) * 1.8 }}>{verse}</Text>
        {i === 0 && hymn.chorus && <View style={{ backgroundColor: colors.brandSoft, borderRadius: 18, padding: 20, gap: 10, marginTop: 8 }}><Text style={styles.kicker}>{preferences.language === 'yo' ? 'Àkórin' : 'Chorus'}</Text><Body reading>{hymn.chorus}</Body></View>}
      </View>)}
      <View style={styles.divider} />
      <View style={styles.between}><Button small label="Previous" variant="outline" icon={ArrowLeft} disabled={index <= 0} onPress={() => navigation.replace('Hymn', { hymnKey: sameBook[index - 1].key })} /><Button small label="Next hymn" variant="outline" icon={ArrowRight} disabled={index >= sameBook.length - 1} onPress={() => navigation.replace('Hymn', { hymnKey: sameBook[index + 1].key })} /></View>
      <Body muted>Hymn text supplied by Hymnize.</Body>
    </>}
  </Screen>;
}
