import { ContentUpdates } from '../components/ContentUpdates';
import React, { useEffect } from 'react';
import { Image, View } from 'react-native';
import { useAppNavigation } from '../navigation';
import { Bookmark, CalendarDays, Download, ExternalLink, HandHeart, HeartHandshake, Info, MapPin, MessageCircle, Minus, Music2, Plus, Settings, Shield, Star } from 'lucide-react-native';
import { Body, Button, Heading, IconButton, LanguagePicker, Loading, MenuRow, Screen, styles } from '../components/ui';
import { Text } from '../components/Text';
import { church } from '../config/church';
import { dateLabel, getDevotion } from '../data/content';
import { openLink, whatsapp } from '../services/links';
import { useApp, useContent } from '../state/AppState';
import { colors, images, serif } from '../theme';
import { HymnRow } from './HymnScreens';

export function MoreScreen() {
  const navigation = useAppNavigation();
  return <Screen>
    <Heading title="Your church family." subtitle="More ways to grow and stay connected." />
    <View style={[styles.panel, styles.row, { backgroundColor: colors.brandSoft, borderWidth: 0, padding: 18 }]}><Image source={images.logo} style={{ width: 56, height: 56, borderRadius: 28 }} resizeMode="contain" accessibilityLabel="Mount Zion church logo" /><View style={{ flex: 1, gap: 4 }}><Text style={[styles.heading, { fontSize: 17 }]}>Mount Zion</Text><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 19 }}>Holiness of Christ Evangelical World Outreach</Text></View></View>
    <View style={styles.section}><Text style={styles.kicker}>OUR CHURCH</Text><View style={[styles.panel, { paddingVertical: 2, gap: 0 }]}><MenuRow icon={HandHeart} title="Prayer plans" detail="Three nights · English and Yoruba" onPress={() => navigation.navigate('Prayers')} /><MenuRow icon={MapPin} title="Services and locations" detail="Plan a visit to Okuku or Ikirun" onPress={() => navigation.navigate('Visit')} /><MenuRow icon={HeartHandshake} title="Sow a seed" detail="Support the work of the ministry" onPress={() => navigation.navigate('Giving')} /><MenuRow icon={MessageCircle} title="Prayer requests and testimonies" onPress={() => navigation.navigate('Connect')} /></View></View>
    <View style={styles.section}><Text style={styles.kicker}>YOUR LIBRARY</Text><View style={[styles.panel, { paddingVertical: 2, gap: 0 }]}><MenuRow icon={Star} title="Saved items" detail="Favourite hymns and bookmarked readings" onPress={() => navigation.navigate('Saved')} /><MenuRow icon={Download} title="Downloads" detail="Listen and watch offline" onPress={() => navigation.navigate('Downloads')} /><MenuRow icon={Settings} title="Reading settings" detail="Language and text size" onPress={() => navigation.navigate('Settings')} /></View></View>
    <View style={[styles.panel, { paddingVertical: 2, gap: 0 }]}><MenuRow icon={Shield} title="Privacy" onPress={() => navigation.navigate('Privacy')} /><MenuRow icon={Info} title="About and sources" onPress={() => navigation.navigate('Sources')} /></View>
    <Button variant="outline" icon={MessageCircle} label="WhatsApp the church" onPress={() => whatsapp('Hello Mount Zion.')} />
    <Body muted>Worship. The Word. Prayer.</Body>
  </Screen>;
}

export function SavedScreen() {
  const content = useContent();
  const navigation = useAppNavigation();
  const { preferences, hymns, hymnsBusy, hymnsError, loadHymns } = useApp();
  useEffect(() => { if (preferences.hymnFavourites.length) void loadHymns(); }, [loadHymns, preferences.hymnFavourites.length]);
  const savedHymns = hymns.filter(hymn => preferences.hymnFavourites.includes(hymn.key) && hymn.language === preferences.language);
  const dates = [...preferences.devotionalBookmarks].sort().reverse();
  return <Screen>
    <Heading title="Saved items" subtitle="Keep the readings and hymns you love." /><LanguagePicker />
    <View style={styles.section}><Text style={styles.heading}>Favourite hymns</Text>
      {hymnsBusy && !hymns.length ? <Loading text="Loading your hymn favourites..." /> : <>
        {savedHymns.map(hymn => <HymnRow key={hymn.key} hymn={hymn} onPress={() => navigation.navigate('Hymn', { hymnKey: hymn.key })} />)}
        {!savedHymns.length && <Body muted>{hymnsError || 'Use the star beside a hymn to save it. Favourites appear in the selected language.'}</Body>}
        {hymnsError && <Button variant="outline" label="Retry hymn download" onPress={() => loadHymns(true)} />}
      </>}
      <Button small variant="quiet" icon={Music2} label="Browse hymns" onPress={() => navigation.navigate('Main', { screen: 'Hymns' })} />
    </View>
    <View style={styles.divider} />
    <View style={styles.section}><Text style={styles.heading}>Devotional bookmarks</Text>{dates.length ? dates.map(date => <MenuRow key={date} icon={Bookmark} title={getDevotion(date, preferences.language, content).title} detail={dateLabel(date)} onPress={() => navigation.navigate('Devotional', { date })} />) : <Body muted>Tap the bookmark in a devotional to save it here.</Body>}<Button small variant="quiet" icon={CalendarDays} label="Read today's devotional" onPress={() => navigation.navigate('Devotional')} /></View>
  </Screen>;
}

export function SettingsScreen() {
  const { preferences, setPreference } = useApp();
  return <Screen>
    <Heading title="Reading settings" subtitle="These choices are saved on this device." />
    <View style={styles.section}><Text style={styles.heading}>Preferred language</Text><LanguagePicker /><Body muted>Hymns, prayer plans, and devotionals use this language.</Body></View>
    <View style={styles.divider} />
    <View style={styles.section}><Text style={styles.heading}>Reading text size</Text><View style={styles.between}><IconButton icon={Minus} label="Decrease reading text size" disabled={preferences.textSize <= 16} onPress={() => setPreference('textSize', Math.max(16, preferences.textSize - 2))} /><Text style={styles.body}>{preferences.textSize} pt</Text><IconButton icon={Plus} label="Increase reading text size" disabled={preferences.textSize >= 26} onPress={() => setPreference('textSize', Math.min(26, preferences.textSize + 2))} /></View><View style={[styles.panel, { backgroundColor: colors.greenSoft }]}><Text style={{ color: colors.ink, fontFamily: serif, fontSize: preferences.textSize, lineHeight: preferences.textSize * 1.6 }}>{preferences.language === 'yo' ? 'Jẹ́ kí ohun gbogbo tí ó ní èémí yin Olúwa.' : 'Let every thing that hath breath praise the Lord.'}</Text><Body muted>Psalm 150:6</Body></View></View>
    <View style={styles.divider} /><Body muted>App version 1.0.1</Body>
  </Screen>;
}

export function PrivacyScreen() {
  return <Screen>
    <Heading title="Privacy" subtitle="How this app uses your information." />
    <View style={styles.section}><Text style={styles.heading}>Saved on your device</Text><Body>Language, reading size, favourite hymns, devotional bookmarks, reading progress, and prayer progress are stored locally. Downloaded hymns and recordings are also saved on your device. Removing the app clears its app storage. Files you export or share outside Mount Zion can remain after uninstalling.</Body></View>
    <View style={styles.section}><Text style={styles.heading}>Prayer requests and testimonies</Text><Body>Continuing to WhatsApp shares your name and message with WhatsApp to prepare a draft, which may also pass through a browser. You choose whether to send it to the church. Form messages are held in memory while the screen is open and are not added to the app’s saved preferences. Ask the church about retention or deletion of messages you send.</Body></View>
    <View style={styles.section}><Text style={styles.heading}>Hymns, recordings, and external links</Text><Body>Public church content is refreshed from the church website and saved locally for offline reading. Hymn downloads contact Hymnize. Streaming and downloading recordings contacts the church website. These services can receive network information such as your IP address. Maps, WhatsApp, social channels, and payment providers follow their own privacy policies.</Body></View>
    <View style={styles.section}><Text style={styles.heading}>Giving</Text><Body>Transfers happen in your bank app. Card payments happen on the church’s payment provider page. The Mount Zion app does not collect card numbers, PINs, or banking passwords.</Body></View>
    <Button variant="outline" icon={MessageCircle} label="Ask the church about privacy" onPress={() => whatsapp('Hello Mount Zion. I have a question about privacy and my information.')} />
  </Screen>;
}

export function SourcesScreen() {
  const content = useContent();
  const { hymns, hymnsSavedAt, hymnsBusy, loadHymns } = useApp();
  return <Screen>
    <Image source={images.logo} style={{ width: 115, height: 115, alignSelf: 'center' }} resizeMode="contain" accessibilityLabel="Mount Zion church logo" />
    <Heading title="About Mount Zion" subtitle={church.fullName} />
    <Body>Worship with us in Okuku or Ikirun, Osun State, Nigeria.</Body>
    <Button variant="outline" icon={ExternalLink} label="Visit the church website" onPress={() => openLink(church.website)} />
    <View style={styles.divider} />
    <View style={styles.section}><ContentUpdates /><Text style={styles.heading}>Devotionals and media</Text><Body>Church photographs, devotional readings, prayer plans, service information, and recordings come from the Mount Zion website.</Body><Body muted>{content.dated.length} dated devotionals · {content.prayers.length} prayer plans · {content.media.length} recordings</Body></View>
    <View style={styles.section}><Text style={styles.heading}>CAC hymn text</Text><Body>The English and Yoruba hymn books are supplied by Hymnize. Hymns download on your first visit to the hymn section and are then available offline.</Body><Body muted>{hymns.length ? `${hymns.length.toLocaleString()} hymn entries loaded.` : 'Hymn books have not been loaded in this session.'}{hymnsSavedAt ? ` Last saved ${new Date(hymnsSavedAt).toLocaleDateString('en-NG')}.` : ''}</Body><Button small variant="outline" label="Refresh hymn books" disabled={hymnsBusy} onPress={() => loadHymns(true)} /><Button small variant="quiet" icon={ExternalLink} label="Visit Hymnize" onPress={() => openLink('https://hymnize.com')} /></View>
    <View style={styles.divider} /><Body muted>Version 1.0.1 · Mount Zion</Body>
  </Screen>;
}
