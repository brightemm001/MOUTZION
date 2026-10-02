import { ContentUpdates, UpcomingEvents } from '../components/ContentUpdates';
import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, BookOpen, ChevronRight, Church, HeartHandshake, MapPin, MessageCircle, Music2, Play, Sparkles } from 'lucide-react-native';
import { useAppNavigation } from '../navigation';
import { Body, Button, IconButton, Screen, styles } from '../components/ui';
import { Text } from '../components/Text';
import { colors, fonts, images } from '../theme';
import { useApp, useContent } from '../state/AppState';
import { dateLabel, getDevotion } from '../data/content';
import { services } from '../config/church';
import { whatsapp } from '../services/links';

export default function HomeScreen() {
  const content = useContent();
  const navigation = useAppNavigation();
  const { width } = useWindowDimensions();
  const { preferences, today } = useApp();
  const devotion = getDevotion(today, preferences.language, content);
  const featured = content.media.find(item => item.category === 'sermon') || content.media[0];
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const localNow = new Date(now + 3600000);
  const weekday = localNow.getUTCDay();
  const hour = localNow.getUTCHours() + localNow.getUTCMinutes() / 60;
  const upcoming = services.filter(s => s.branch === 'Okuku').map(s => ({ ...s, distance: ((s.weekday - weekday + 7) % 7) * 24 + s.hour - hour }))
    .map(s => ({ ...s, distance: s.distance < 0 ? s.distance + 168 : s.distance })).sort((a, b) => a.distance - b.distance)[0];

  return <Screen style={{ paddingTop: 8 }}>
    <ContentUpdates />
    <View style={{ gap: 5 }}><Text style={[styles.muted, { fontSize: 12 }]}>{new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' }).format(new Date(`${today}T12:00:00Z`))}</Text><Text accessibilityRole="header" style={[styles.title, { fontSize: 28, lineHeight: 36 }]}>Welcome home.</Text><Body muted>A family of faith. A life of purpose.</Body></View>

    <Pressable accessibilityRole="button" accessibilityLabel="Discover Mount Zion" onPress={() => navigation.navigate('Visit')} style={({ pressed }) => ({ height: 246, borderRadius: 24, backgroundColor: colors.plum, overflow: 'hidden', opacity: pressed ? 0.9 : 1 })}>
      <Image source={images['pastor-preaching']} accessibilityLabel="Pastor preaching at Mount Zion" style={{ position: 'absolute', width: '100%', height: (Math.min(width, 680) - 48) * 4 / 3, top: 0 }} resizeMode="cover" />
      <LinearGradient colors={['transparent', '#241B2670', '#241B26ED']} locations={[0.18, 0.65, 1]} style={{ flex: 1, padding: 22, justifyContent: 'flex-end', gap: 6 }}>
        <Text style={[styles.kicker, { color: '#EADCE6', fontSize: 9 }]}>WORSHIP · THE WORD · PRAYER</Text>
        <Text style={{ color: colors.surface, fontSize: width < 360 ? 24 : 27, lineHeight: 33, fontWeight: '600', letterSpacing: -0.7 }}>Rooted in Christ.{'\n'}Growing together.</Text>
        <View style={{ position: 'absolute', right: 18, top: 18, width: 38, height: 38, borderRadius: 19, backgroundColor: '#241B2670', alignItems: 'center', justifyContent: 'center' }}><ArrowUpRight size={19} color={colors.surface} /></View>
      </LinearGradient>
    </Pressable>

    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
      {[
        { label: 'Hymns', icon: Music2, tone: colors.brand, bg: colors.brandSoft, action: () => navigation.navigate('Main', { screen: 'Hymns' }) },
        { label: 'Prayer plans', icon: Sparkles, tone: colors.green, bg: colors.greenSoft, action: () => navigation.navigate('Prayers') },
        { label: 'Visit us', icon: MapPin, tone: colors.gold, bg: colors.goldSoft, action: () => navigation.navigate('Visit') },
        { label: 'Give', icon: HeartHandshake, tone: colors.brand, bg: colors.brandSoft, action: () => navigation.navigate('Giving') },
      ].map(({ label, icon: Icon, tone, bg, action }) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={action}
        style={({ pressed }) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9, opacity: pressed ? 0.6 : 1 })}>
        <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}><Icon size={23} strokeWidth={1.7} color={tone} /></View><Text numberOfLines={1} style={{ color: colors.ink, fontSize: 11, lineHeight: 17, fontWeight: '500', textAlign: 'center' }}>{label === 'Prayer plans' ? 'Prayers' : label}</Text>
      </Pressable>)}
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Read today's devotional" onPress={() => navigation.navigate('Devotional', { date: today })}
      style={({ pressed }) => [styles.panel, { backgroundColor: colors.surface, padding: 20, gap: 12, opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.between}><View style={[styles.row, { gap: 8 }]}><BookOpen size={15} strokeWidth={1.8} color={colors.brand} /><Text style={styles.kicker}>Today’s devotional</Text></View><Text style={[styles.muted, { fontSize: 11 }]}>DAILY FAITH</Text></View>
      <Text style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 22, lineHeight: 30 }}>{devotion.title}</Text>
      <View style={styles.between}><Text style={[styles.muted, { fontSize: 12 }]}>{dateLabel(today)}</Text><View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={18} color={colors.brand} /></View></View>
    </Pressable>

    <UpcomingEvents limit={2} />
    <View style={styles.section}>
      <View style={styles.between}><Text style={styles.heading}>Gather with us</Text><IconButton icon={ChevronRight} label="All services and locations" onPress={() => navigation.navigate('Visit')} /></View>
      <View style={[styles.panel, styles.row, { alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderWidth: 0 }]}><View style={{ backgroundColor: '#FFFFFFA0', padding: 12, borderRadius: 16 }}><Church size={22} color={colors.gold} /></View>
        <View style={{ flex: 1, gap: 6 }}><Text style={[styles.kicker, { color: colors.gold, fontSize: 9, letterSpacing: 1 }]}>Next at Okuku headquarters</Text><Text style={[styles.heading, { fontSize: 17, lineHeight: 24 }]}>{upcoming.title}</Text><Text style={[styles.body, { fontSize: 13 }]}>{upcoming.day} · {upcoming.time} WAT</Text></View>
      </View>
    </View>

    <View style={[styles.section, { paddingHorizontal: 8, paddingVertical: 8 }]}><Text style={styles.kicker}>A moment in the Word</Text><Text selectable style={[styles.verse, { fontSize: 21 }]}>{devotion.verse}</Text></View>

    <View style={styles.section}>
      <View style={styles.between}><Text style={styles.heading}>From the pulpit</Text><IconButton icon={ChevronRight} label="Open sermon library" onPress={() => navigation.navigate('Main', { screen: 'Media' })} /></View>
      {featured ? <Pressable accessibilityRole="button" accessibilityLabel={`Play ${featured.title}`} onPress={() => navigation.navigate('Player', { mediaId: featured.id, format: 'mp4' })}>
        <ImageBackground source={images[featured.poster]} style={{ width: '100%', height: 200, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ position: 'absolute', inset: 0, backgroundColor: '#2B233022' }} /><View style={{ backgroundColor: '#FFFFFFEB', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}><Play size={23} color={colors.brand} fill={colors.brand} /></View>
        </ImageBackground>
        <Text style={[styles.kicker, { marginTop: 14, marginBottom: 5 }]}>WATCH OR LISTEN</Text><Text style={[styles.heading, { fontSize: 18, lineHeight: 25 }]}>{featured.title}</Text>
      </Pressable> : <Body muted>New recordings will appear here when published.</Body>}
    </View>

    <View style={styles.section}><Text style={styles.heading}>Moments at Mount Zion</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {['prayer-gathering', 'revival', 'city-of-prayer', 'pastor', 'womens-ministry'].map(name => <Image key={name} source={images[name]} accessibilityLabel={`Mount Zion ${name.replaceAll('-', ' ')}`} style={{ width: 160, height: 180, borderRadius: 20 }} />)}
      </ScrollView>
    </View>

    <View style={[styles.panel, { backgroundColor: colors.brandSoft, borderWidth: 0 }]}><Text style={styles.heading}>We’re here for you.</Text><Body muted>Share a prayer request, a testimony, or a question with the Mount Zion family.</Body>
      <View style={styles.wrap}><Button label="Prayer request" icon={MessageCircle} variant="outline" onPress={() => navigation.navigate('Connect', { kind: 'prayer' })} /><Button label="WhatsApp us" icon={MessageCircle} onPress={() => whatsapp('Hello Mount Zion. I would like to get in touch.')} /></View>
    </View>
  </Screen>;
}
