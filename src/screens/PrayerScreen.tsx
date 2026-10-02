import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ArrowRight, CheckCircle2, Circle, MessageCircle, Moon } from 'lucide-react-native';
import { useAppNavigation } from '../navigation';
import { Body, Button, Chips, Heading, LanguagePicker, Screen, styles } from '../components/ui';
import { Text } from '../components/Text';
import { useApp, useContent } from '../state/AppState';
import { colors } from '../theme';

export default function PrayerScreen() {
  const content = useContent();
  const navigation = useAppNavigation();
  const { preferences, toggle } = useApp();
  const [category, setCategory] = useState(content.prayers[0].category);
  const [night, setNight] = useState<'0' | '1' | '2'>('0');
  const plan = content.prayers.find(p => p.category === category) || content.prayers[0];
  const day = Number(night);
  const yo = preferences.language === 'yo';
  const points = plan.points[preferences.language].slice(day * 7, day * 7 + 7);
  const key = (i: number) => `${plan.category}:${night}:${i}`;
  const complete = points.filter((_, i) => preferences.prayerProgress.includes(key(i))).length;

  return <Screen>
    <Heading title={yo ? 'Àdúrà fún òru mẹ́ta' : 'Three nights of prayer'} subtitle={yo ? 'Yan ohun tí o fẹ́ gbàdúrà nípa rẹ̀.' : 'Choose a focus and pray at your own pace.'} />
    <LanguagePicker />
    <View style={{ gap: 10 }}><Text style={styles.kicker}>{yo ? 'YAN ÌDOJÚKỌ́ RẸ' : 'CHOOSE YOUR FOCUS'}</Text><Chips scroll items={content.prayers.map(p => ({ value: p.category, label: p.label[preferences.language] }))} value={plan.category} onChange={value => { setCategory(value); setNight('0'); }} /></View>
    <Chips items={(['0', '1', '2'] as const).map(value => ({ value, label: `${yo ? 'Alẹ́' : 'Night'} ${Number(value) + 1}` }))} value={night} onChange={setNight} />
    <View style={[styles.panel, { backgroundColor: colors.plum, borderWidth: 0, padding: 22 }]}><View style={styles.between}><View style={[styles.row, { gap: 7 }]}><Moon size={15} color="#E6CADB" /><Text style={[styles.kicker, { color: '#E6CADB' }]}>{yo ? 'ALẸ́' : 'NIGHT'} 0{day + 1}</Text></View><Text style={{ color: '#E6CADB', fontSize: 11 }}>{complete} / 7 {yo ? 'ti parí' : 'completed'}</Text></View><Text style={[styles.heading, { color: colors.surface, fontSize: 22, lineHeight: 30 }]}>{plan.themes[preferences.language][day]}</Text><Text style={{ color: '#DACDD6', fontSize: 13, lineHeight: 21 }}>{yo ? 'Ka kí o sì ronú lórí:' : 'Read and reflect:'} {plan.refs[day]}</Text>
      <View style={{ backgroundColor: '#FFFFFF25', height: 4, borderRadius: 5, marginTop: 2 }}><View style={{ backgroundColor: '#D995C3', height: 4, borderRadius: 5, width: `${complete / 7 * 100}%` }} /></View>
    </View>
    <View style={{ backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18 }}>{points.map((point, i) => {
      const checked = preferences.prayerProgress.includes(key(i));
      const Icon = checked ? CheckCircle2 : Circle;
      return <Pressable key={key(i)} accessibilityRole="checkbox" accessibilityLabel={`Prayer ${i + 1}: ${point}`} accessibilityState={{ checked }} aria-checked={checked} onPress={() => toggle('prayerProgress', key(i))}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 20, borderBottomWidth: i < 6 ? 1 : 0, borderBottomColor: colors.line, opacity: pressed ? 0.65 : 1 })}>
        <Icon size={22} strokeWidth={1.6} color={checked ? colors.brand : '#BEB6BE'} style={{ marginTop: 5 }} /><View style={{ flex: 1, gap: 6 }}><Text style={[styles.kicker, { color: checked ? colors.brand : colors.muted, fontSize: 9 }]}>{yo ? 'ÀDÚRÀ' : 'PRAYER'} 0{i + 1}</Text><Body reading>{point}</Body></View>
      </Pressable>;
    })}</View>
    {day < 2 && <Button label={yo ? 'Alẹ́ tó kàn' : 'Continue to next night'} icon={ArrowRight} onPress={() => setNight(String(day + 1) as '1' | '2')} />}
    <View style={styles.divider} />
    <Button label={yo ? 'Rán ìbéèrè àdúrà' : 'Send a personal prayer request'} icon={MessageCircle} variant="outline" onPress={() => navigation.navigate('Connect', { kind: 'prayer' })} />
  </Screen>;
}
