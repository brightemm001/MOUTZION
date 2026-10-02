import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Globe, Heart, MessageCircle, Phone, Video } from 'lucide-react-native';
import { Body, Button, Chips, Heading, MenuRow, Screen, styles } from '../components/ui';
import { Text } from '../components/Text';
import { church } from '../config/church';
import { openLink, whatsapp } from '../services/links';
import { messageLimits, validateMessageForm } from '../services/forms';
import { colors } from '../theme';

export default function ConnectScreen({ kind: initialKind }: { kind?: 'prayer' | 'testimony' }) {
  const [kind, setKind] = useState<'prayer' | 'testimony'>(initialKind || 'prayer');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async () => {
    const validated = validateMessageForm({ name, message, kind });
    if (!validated.valid) { setError(validated.error); return; }
    setError('');
    await whatsapp(`Hello Mount Zion. My name is ${validated.name}.\n\n${validated.kind === 'prayer' ? 'Prayer request' : 'Testimony'}:\n${validated.message}`);
  };
  return <Screen>
    <View style={{ gap: 14 }}><View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: colors.brandSoft, justifyContent: 'center', alignItems: 'center' }}><Heart size={23} strokeWidth={1.6} color={colors.brand} /></View><Heading title="Connect with us" subtitle="You don’t have to walk alone." /></View>
    <Chips<'prayer' | 'testimony'> value={kind} onChange={value => { setKind(value); setError(''); }} items={[{ value: 'prayer', label: 'Prayer request' }, { value: 'testimony', label: 'Testimony' }]} />
    <Body>{kind === 'prayer' ? 'Share what you would like the church to pray about.' : 'Tell the church what God has done. The ministry will ask before sharing your testimony publicly.'}</Body>
    <View style={styles.section}><Text style={[styles.body, { fontSize: 13, fontWeight: '600' }]}>Your name</Text><TextInput accessibilityLabel="Your name" autoComplete="name" textContentType="name" maxLength={100} placeholder="Enter your name" placeholderTextColor={colors.muted} value={name} onChangeText={value => { setName(value); setError(''); }} style={styles.input} /></View>
    <View style={styles.section}><Text style={[styles.body, { fontSize: 13, fontWeight: '600' }]}>{kind === 'prayer' ? 'Your prayer request' : 'Your testimony'}</Text><TextInput accessibilityLabel={kind === 'prayer' ? 'Your prayer request' : 'Your testimony'} placeholder="Write your message..." placeholderTextColor={colors.muted} multiline maxLength={messageLimits[kind]} value={message} onChangeText={value => { setMessage(value); setError(''); }} style={[styles.input, { minHeight: 160, paddingVertical: 16, textAlignVertical: 'top' }]} /><Body muted>{message.length.toLocaleString('en-NG')} / {messageLimits[kind].toLocaleString('en-NG')} characters</Body></View>
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>}
    <Button icon={MessageCircle} label="Continue to WhatsApp" onPress={submit} />
    <Body muted>Your name and message are shared with WhatsApp to prepare the draft. Review it there, then tap Send to deliver it to {church.phone}. Avoid including passwords, card details, or other private credentials.</Body>
    <View style={styles.divider} />
    <View style={[styles.panel, { paddingVertical: 4, gap: 0 }]}><MenuRow icon={Phone} title={`Call ${church.phone}`} onPress={() => openLink(`tel:+${church.whatsapp}`)} /><MenuRow icon={MessageCircle} title="Message the church" detail="Service questions and ministry updates" onPress={() => whatsapp('Hello Mount Zion.')} /><MenuRow icon={Globe} title="Facebook" onPress={() => openLink(church.facebook)} /><MenuRow icon={Video} title="TikTok" detail="@virtous.women25" onPress={() => openLink(church.tiktok)} /></View>
  </Screen>;
}
