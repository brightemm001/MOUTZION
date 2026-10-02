import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRight, Search, X, type LucideIcon } from 'lucide-react-native';
import { colors, fonts, serif } from '../theme';
import { Text } from './Text';
import { useApp } from '../state/AppState';
import type { Language } from '../types';

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 22, paddingBottom: 36, gap: 24, width: '100%', maxWidth: 680, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 37, fontWeight: '700', letterSpacing: -0.8 },
  heading: { color: colors.ink, fontSize: 20, lineHeight: 27, fontWeight: '700', letterSpacing: -0.45 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 25 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  kicker: { color: colors.brand, fontSize: 10, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  panel: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 },
  divider: { height: 1, backgroundColor: colors.line },
  input: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, minHeight: 54, fontSize: 15, fontFamily: fonts.regular, color: colors.ink },
  verse: { color: colors.ink, fontFamily: serif, fontSize: 22, lineHeight: 34 },
  section: { gap: 12 },
});

export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  return scroll ? <ScrollView style={styles.page} contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
    : <View style={[styles.page, style]}>{children}</View>;
}

export function Body({ children, muted = false, reading = false }: { children: React.ReactNode; muted?: boolean; reading?: boolean }) {
  const { preferences } = useApp();
  return <Text style={[muted ? styles.muted : styles.body, reading && { fontSize: preferences.textSize, lineHeight: Math.round(preferences.textSize * 1.6) }]}>{children}</Text>;
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={{ gap: 8, flexShrink: 1 }}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle && <Body muted>{subtitle}</Body>}</View>;
}

export function Button({ label, icon: Icon, onPress, variant = 'primary', disabled = false, small = false }: {
  label: string; icon?: LucideIcon; onPress: () => void | Promise<unknown>; variant?: 'primary' | 'outline' | 'quiet'; disabled?: boolean; small?: boolean;
}) {
  const { notify } = useApp();
  const primary = variant === 'primary';
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
    onPress={() => { Promise.resolve().then(onPress).catch(() => notify('Could not complete that action. Please try again.')); }}
    style={({ pressed }) => [{ minHeight: small ? 44 : 52, paddingVertical: small ? 11 : 15, paddingHorizontal: small ? 14 : 20, borderRadius: 14, borderWidth: variant === 'outline' ? 1 : 0, borderColor: colors.line, backgroundColor: primary ? colors.brand : variant === 'outline' ? colors.surface : 'transparent', opacity: disabled ? 0.4 : pressed ? 0.75 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, maxWidth: '100%' }]}
  >{Icon && <Icon size={small ? 16 : 18} strokeWidth={1.8} color={primary ? colors.surface : colors.brand} />}<Text style={{ fontSize: small ? 12 : 14, lineHeight: 20, fontWeight: '600', color: primary ? colors.surface : colors.brand, flexShrink: 1 }}>{label}</Text></Pressable>;
}

export function IconButton({ icon: Icon, label, onPress, active = false, disabled = false }: { icon: LucideIcon; label: string; onPress: () => void | Promise<unknown>; active?: boolean; disabled?: boolean }) {
  const { notify } = useApp();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected: active }} aria-pressed={active} disabled={disabled}
    onPress={() => { Promise.resolve().then(onPress).catch(() => notify('Could not complete that action. Please try again.')); }}
    style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.brandSoft : 'transparent', opacity: disabled ? 0.35 : pressed ? 0.6 : 1 })}
  ><Icon size={20} strokeWidth={1.8} color={active ? colors.brand : colors.ink} fill={active ? colors.brandSoft : 'none'} /></Pressable>;
}

export function Chips<T extends string>({ items, value, onChange, scroll = false }: { items: { value: T; label: string }[]; value: T; onChange: (value: T) => void; scroll?: boolean }) {
  const buttons = items.map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: value === item.value }} aria-pressed={value === item.value} onPress={() => onChange(item.value)}
    style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: value === item.value ? colors.brand : colors.line, backgroundColor: value === item.value ? colors.brand : colors.surface, opacity: pressed ? 0.7 : 1 })}
  ><Text style={{ fontSize: 12, lineHeight: 18, color: value === item.value ? colors.surface : colors.muted, fontWeight: '600' }}>{item.label}</Text></Pressable>);
  return scroll ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>{buttons}</ScrollView> : <View style={styles.wrap}>{buttons}</View>;
}

export function LanguagePicker() {
  const { preferences, setPreference } = useApp();
  return <View style={{ flexDirection: 'row', backgroundColor: '#F0EBEE', borderRadius: 14, padding: 4, alignSelf: 'flex-start' }}>
    {([{ value: 'en', label: 'English' }, { value: 'yo', label: 'Yoruba' }] as { value: Language; label: string }[]).map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: preferences.language === item.value }} aria-pressed={preferences.language === item.value} onPress={() => setPreference('language', item.value)} style={({ pressed }) => ({ minHeight: 44, minWidth: 96, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: preferences.language === item.value ? colors.surface : 'transparent', borderRadius: 11, opacity: pressed ? 0.6 : 1 })}><Text style={{ fontSize: 13, fontWeight: '600', color: preferences.language === item.value ? colors.brand : colors.muted }}>{item.label}</Text></Pressable>)}
  </View>;
}

export function TextTabs<T extends string>({ items, value, onChange }: { items: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <View style={{ flexDirection: 'row', gap: 22, borderBottomWidth: 1, borderBottomColor: colors.line }}>{items.map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: value === item.value }} aria-pressed={value === item.value} onPress={() => onChange(item.value)} style={{ minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: value === item.value ? colors.brand : 'transparent', marginBottom: -1 }}><Text style={{ fontSize: 13, fontWeight: '600', color: value === item.value ? colors.brand : colors.muted }}>{item.label}</Text></Pressable>)}</View>;
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <View style={[styles.row, styles.input, { paddingRight: 3, paddingLeft: 13, gap: 8 }]}><Search size={19} color={colors.muted} />
    <TextInput accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor={colors.muted} value={value} onChangeText={onChange} maxLength={200} autoCapitalize="none" autoCorrect={false} style={{ flex: 1, paddingVertical: 14, fontSize: 14, fontFamily: fonts.regular, color: colors.ink, minWidth: 0 }} returnKeyType="search" />
    {value.length > 0 && <IconButton icon={X} label="Clear search" onPress={() => onChange('')} />}
  </View>;
}

export function MenuRow({ icon: Icon, title, detail, onPress }: { icon: LucideIcon; title: string; detail?: string; onPress: () => void | Promise<unknown> }) {
  const { notify } = useApp();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => { Promise.resolve().then(onPress).catch(() => notify('Could not open this option. Please try again.')); }}
    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomColor: colors.line, borderBottomWidth: 1, opacity: pressed ? 0.6 : 1 })}>
    <View style={{ backgroundColor: colors.brandSoft, width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}><Icon size={19} strokeWidth={1.7} color={colors.brand} /></View>
    <View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' }}>{title}</Text>{detail && <Text style={[styles.muted, { fontSize: 12, lineHeight: 18 }]}>{detail}</Text>}</View>
    <ChevronRight color={colors.muted} size={19} />
  </Pressable>;
}

export function Empty({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return <View style={{ paddingVertical: 36, paddingHorizontal: 18, alignItems: 'center', gap: 14 }}><View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }}><Icon color={colors.brand} size={30} strokeWidth={1.5} /></View><Text style={[styles.heading, { textAlign: 'center' }]}>{title}</Text><Text style={[styles.muted, { textAlign: 'center' }]}>{description}</Text>{action}</View>;
}

export function Loading({ text }: { text: string }) {
  return <View style={{ padding: 30, gap: 15, alignItems: 'center' }}><ActivityIndicator color={colors.brand} size="large" /><Body muted>{text}</Body></View>;
}
