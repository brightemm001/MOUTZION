import { ContentUpdates } from '../components/ContentUpdates';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Share, View } from 'react-native';
import { Bookmark, CalendarDays, Check, ChevronLeft, ChevronRight, Share2, X } from 'lucide-react-native';
import { Body, Button, IconButton, LanguagePicker, Screen, styles } from '../components/ui';
import { Text } from '../components/Text';
import { useApp, useContent } from '../state/AppState';
import { dateLabel, getDevotion, shiftDate } from '../data/content';
import { church } from '../config/church';
import { colors, fonts } from '../theme';

const labels = {
  en: { reading: 'Bible reading', verse: 'Memory verse', fire: 'Fire Scripture', word: 'A word for today', thought: 'A thought to carry', morning: 'Morning prayers', evening: 'Evening prayers', declaration: 'Prophetic word', worship: 'Begin with praise and worship.' },
  yo: { reading: 'Kíkà Bíbélì', verse: 'Ẹsẹ ìrántí', fire: 'Ìwé Mímọ́ fún ọjọ́ náà', word: 'Ọ̀rọ̀ fún òní', thought: 'Èrò ìṣírí', morning: 'Àdúrà òwúrọ̀', evening: 'Àdúrà alẹ́', declaration: 'Ọ̀rọ̀ ìsọtẹ́lẹ̀', worship: 'Bẹ̀rẹ̀ pẹ̀lú ìyìn àti ìjọsìn.' },
};

export default function DevotionalScreen({ date: initialDate }: { date?: string }) {
  const content = useContent();
  const { preferences, today, toggle } = useApp();
  const [chosen, setChosen] = useState<string | null>(initialDate || null);
  const [calendar, setCalendar] = useState(false);
  const date = chosen || today;
  const entry = getDevotion(date, preferences.language, content);
  const ui = labels[preferences.language];
  const saved = preferences.devotionalBookmarks.includes(date);
  const read = preferences.devotionalRead.includes(date);
  const dates = [...new Set([date, ...Array.from({ length: 7 }, (_, i) => shiftDate(today, -i)), ...content.dated.map(d => d.date)])].sort();
  const selectedIndex = dates.indexOf(date);

  return <Screen>
    <ContentUpdates />
    <View style={styles.between}><View style={{ gap: 3 }}><Text style={styles.kicker}>THE DAILY WALK</Text><Text style={{ color: colors.muted, fontSize: 12 }}>Make room for the Word.</Text></View><View style={[styles.row, { gap: 0 }]}>
      <IconButton icon={Bookmark} label={saved ? 'Remove devotional bookmark' : 'Bookmark this devotional'} active={saved} onPress={() => toggle('devotionalBookmarks', date)} />
      <IconButton icon={Share2} label="Share this devotional" onPress={() => Share.share({ message: `${entry.title}\n${dateLabel(date)}\n\n${entry.quote}\n\nRead with Mount Zion: ${church.website}/devotional.html` })} />
    </View></View>
    <LanguagePicker />
    <View style={[styles.between, { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 3, borderWidth: 1, borderColor: colors.line, gap: 0 }]}>
      <IconButton icon={ChevronLeft} label="Previous devotional" disabled={selectedIndex <= 0} onPress={() => setChosen(dates[selectedIndex - 1])} />
      <Pressable accessibilityRole="button" accessibilityLabel="Choose devotional date" onPress={() => setCalendar(true)} style={[styles.row, { flex: 1, justifyContent: 'center', gap: 7, minHeight: 48 }]}><CalendarDays size={15} color={colors.brand} /><Text style={{ color: colors.ink, fontSize: 12, flexShrink: 1, textAlign: 'center' }}>{dateLabel(date)}</Text></Pressable>
      <IconButton icon={ChevronRight} label="Next devotional" disabled={selectedIndex >= dates.length - 1} onPress={() => setChosen(dates[selectedIndex + 1])} />
    </View>
    {date !== today && <Button label="Back to today" small variant="quiet" onPress={() => setChosen(null)} />}
    <View style={{ gap: 8 }}><Text style={styles.kicker}>{preferences.language === 'yo' ? 'ÌWÚRÍ FÚN ỌJỌ́ NÁÀ' : 'TODAY’S DEVOTIONAL'}</Text><Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 29, lineHeight: 39 }}>{entry.title}</Text></View>
    <View style={{ gap: 14 }}><View style={{ gap: 5 }}><Text style={styles.kicker}>{ui.reading}</Text><Body reading>{entry.reading}</Body></View>
      <View style={{ gap: 14, padding: 22, backgroundColor: colors.brandSoft, borderRadius: 22 }}><Text style={styles.kicker}>{ui.verse}</Text><Text selectable style={{ color: colors.plum, fontFamily: fonts.serif, fontSize: preferences.textSize + 1, lineHeight: (preferences.textSize + 1) * 1.7 }}>{entry.verse}</Text></View>
      <View style={{ gap: 5 }}><Text style={styles.kicker}>{ui.fire}</Text><Body reading>{entry.fire}</Body></View>
    </View>
    <View style={styles.divider} />
    <Body muted>{ui.worship}</Body>
    <View style={styles.section}><Text style={styles.heading}>{ui.word}</Text>{entry.message.map((paragraph, i) => <Body key={i} reading>{paragraph}</Body>)}</View>
    <View style={{ padding: 22, borderRadius: 20, backgroundColor: colors.goldSoft, gap: 12 }}><Text style={[styles.kicker, { color: colors.gold }]}>{ui.thought}</Text><Text selectable style={{ color: colors.ink, fontFamily: fonts.serifItalic, fontSize: preferences.textSize + 1, lineHeight: (preferences.textSize + 1) * 1.6 }}>{entry.quote}</Text></View>
    {[{ title: ui.morning, points: entry.morning }, { title: ui.evening, points: entry.evening }].map(section => <View key={section.title} style={styles.section}><Text style={styles.heading}>{section.title}</Text>{section.points.map((point, i) => <View key={i} style={[styles.row, { alignItems: 'flex-start' }]}><Text style={[styles.kicker, { paddingTop: 5 }]}>{i + 1}.</Text><View style={{ flex: 1 }}><Body reading>{point}</Body></View></View>)}</View>)}
    <View style={styles.section}><Text style={styles.heading}>{ui.declaration}</Text><Body reading>{entry.declaration}</Body></View>
    <Button label={read ? 'Marked as read' : 'Mark as read'} icon={Check} variant={read ? 'outline' : 'primary'} onPress={() => toggle('devotionalRead', date)} />
    <Body muted>{content.dated.some(d => d.date === date) ? 'From the Mount Zion daily devotional collection.' : 'From the Mount Zion weekly devotional collection.'} Daily readings follow Nigeria’s time zone.</Body>
    <Modal visible={calendar} transparent animationType="fade" onRequestClose={() => setCalendar(false)}>
      <View style={{ flex: 1, backgroundColor: '#00000055', padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 500, maxHeight: '80%', backgroundColor: colors.surface, borderRadius: 24, padding: 20 }}>
          <View style={styles.between}><Text style={styles.heading}>Choose a devotional</Text><IconButton icon={X} label="Close devotional dates" onPress={() => setCalendar(false)} /></View>
          <FlatList data={dates} keyExtractor={key => key} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={dateLabel(item)} onPress={() => { setChosen(item); setCalendar(false); }} style={{ paddingVertical: 15, borderBottomColor: colors.line, borderBottomWidth: 1, gap: 5 }}><Text style={{ color: item === date ? colors.brand : colors.ink, fontSize: 15, fontWeight: '600' }}>{dateLabel(item)}</Text><Body muted>{getDevotion(item, preferences.language, content).title}</Body></Pressable>} />
        </View>
      </View>
    </Modal>
  </Screen>;
}
