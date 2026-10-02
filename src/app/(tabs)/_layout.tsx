import React from 'react';
import { Image, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Home, Menu, Music2, Star, Video, type LucideIcon } from 'lucide-react-native';
import { IconButton } from '../../components/ui';
import { Text } from '../../components/Text';
import { colors, fonts, images } from '../../theme';

const icons: Record<string, LucideIcon> = { index: Home, hymns: Music2, media: Video, daily: BookOpen, more: Menu };

function BrandTitle() {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 43, height: 43, borderRadius: 22, backgroundColor: colors.surface, padding: 4, borderWidth: 1, borderColor: colors.line }}><Image source={images.logo} style={{ width: 33, height: 33, borderRadius: 17 }} resizeMode="contain" accessibilityLabel="Mount Zion church logo" /></View><View style={{ gap: 1 }}><Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.5 }}>Mount Zion</Text><Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 1.4 }}>OKUKU · IKIRUN</Text></View></View>;
}

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={({ route }) => ({
    headerTitle: () => <BrandTitle />,
    headerTitleAlign: 'left',
    headerRight: () => <View style={{ flexDirection: 'row', gap: 0 }}><IconButton icon={Star} label="Open saved items" onPress={() => router.navigate('/saved')} />{route.name !== 'more' && <IconButton icon={Menu} label="Open menu" onPress={() => router.navigate('/more')} />}</View>,
    headerRightContainerStyle: { paddingRight: 14 },
    headerTitleContainerStyle: { left: 24 },
    headerStyle: { backgroundColor: colors.background, height: 76 + insets.top },
    headerShadowVisible: false,
    tabBarActiveTintColor: colors.brand,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 10, lineHeight: 14, fontFamily: fonts.medium, marginTop: 2 },
    tabBarAllowFontScaling: false,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 78 + insets.bottom, paddingTop: 10, paddingBottom: Math.max(10, insets.bottom) },
    tabBarItemStyle: { paddingVertical: 1 },
    tabBarHideOnKeyboard: true,
    tabBarIcon: ({ color, focused }) => { const Icon = icons[route.name] || Home; return <View style={{ width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.brandSoft : 'transparent' }}><Icon size={20} color={color} strokeWidth={focused ? 2 : 1.65} /></View>; },
  })}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="hymns" options={{ title: 'Hymns' }} />
    <Tabs.Screen name="media" options={{ title: 'Media' }} />
    <Tabs.Screen name="daily" options={{ title: 'Devotional' }} />
    <Tabs.Screen name="more" options={{ title: 'More' }} />
  </Tabs>;
}
