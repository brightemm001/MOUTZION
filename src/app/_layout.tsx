import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../state/AppState';
import { colors, fontAssets, fonts, images } from '../theme';
import { Text } from '../components/Text';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  // Do not render the error object, stack, URLs, server messages, or provider-dependent UI.
  return <View style={{ flex: 1, padding: 32, justifyContent: 'center', gap: 18, backgroundColor: colors.background }}>
    <Text accessibilityRole="header" style={{ fontSize: 24, color: colors.ink }}>Let’s try that again</Text>
    <Text style={{ fontSize: 16, lineHeight: 25, color: colors.muted }}>This screen could not open. Please try again, or close and reopen Mount Zion.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Try opening this screen again" onPress={() => { void Promise.resolve().then(retry).catch(() => undefined); }} style={{ padding: 18, backgroundColor: colors.brand, borderRadius: 14 }}><Text style={{ color: colors.surface }}>Try again</Text></Pressable>
  </View>;
}
export const unstable_settings = { initialRouteName: '(tabs)' };
if (Platform.OS !== 'web') SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppContent() {
  const { ready, notice } = useApp();
  const [assetsReady, setAssetsReady] = useState(false);
  const [fontsReady, fontError] = useFonts(fontAssets);
  const loaded = ready && assetsReady && (fontsReady || !!fontError);
  const insets = useSafeAreaInsets();
  useEffect(() => { Asset.loadAsync([images.logo, images['pastor-preaching']]).catch(() => undefined).finally(() => setAssetsReady(true)); }, []);
  useEffect(() => { if (loaded && Platform.OS !== 'web') SplashScreen.hideAsync().catch(() => undefined); }, [loaded]);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 18 }}><Image source={images.logo} style={{ width: 180, height: 180 }} resizeMode="contain" accessibilityLabel="Mount Zion church logo" /></View>;
  return <View style={{ flex: 1 }}><ThemeProvider value={{ ...DefaultTheme, fonts: { regular: { fontFamily: fonts.regular, fontWeight: '400' }, medium: { fontFamily: fonts.medium, fontWeight: '400' }, bold: { fontFamily: fonts.bold, fontWeight: '400' }, heavy: { fontFamily: fonts.bold, fontWeight: '400' } }, colors: { primary: colors.brand, background: colors.background, card: colors.background, text: colors.ink, border: colors.line, notification: colors.brand } }}>
    <Stack screenOptions={{ headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background }, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="hymn" options={{ title: 'Hymn' }} />
      <Stack.Screen name="devotional" options={{ title: 'Devotional' }} />
      <Stack.Screen name="prayers" options={{ title: 'Prayer plans' }} />
      <Stack.Screen name="player" options={{ title: 'Mount Zion Media' }} />
      <Stack.Screen name="giving" options={{ title: 'Sow a seed' }} />
      <Stack.Screen name="connect" options={{ title: 'Connect' }} />
      <Stack.Screen name="visit" options={{ title: 'Services and locations' }} />
      <Stack.Screen name="saved" options={{ title: 'Saved items' }} />
      <Stack.Screen name="downloads" options={{ title: 'Downloads' }} />
      <Stack.Screen name="settings" options={{ title: 'Reading settings' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="sources" options={{ title: 'About and sources' }} />
    </Stack>
  </ThemeProvider>{notice && <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', bottom: 88 + insets.bottom, left: 24, right: 24, backgroundColor: colors.plum, borderRadius: 16, padding: 16, alignSelf: 'center', maxWidth: 680 }}><Text style={{ color: colors.surface, fontSize: 13, lineHeight: 21 }}>{notice}</Text></View>}</View>;
}

export default function RootLayout() {
  return <SafeAreaProvider><AppProvider><StatusBar style="dark" /><AppContent /></AppProvider></SafeAreaProvider>;
}
