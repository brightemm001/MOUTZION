import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ArrowUpRight, Copy, CreditCard, HeartHandshake, Landmark, MessageCircle } from 'lucide-react-native';
import { Body, Button, Chips, Heading, Screen, styles } from '../components/ui';
import { Text } from '../components/Text';
import { useApp } from '../state/AppState';
import { church } from '../config/church';
import { giftAmount } from '../services/giving';
import { openLink, whatsapp } from '../services/links';
import { colors, fonts } from '../theme';

export default function GivingScreen() {
  const { notify } = useApp();
  const [method, setMethod] = useState<'transfer' | 'card'>('transfer');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(false);
  const gift = giftAmount(amount);
  const checkout = church.cardCheckoutUrl;
  const continueWith = async (action: (text: string) => Promise<void>) => {
    setError(!gift.valid);
    if (gift.valid) await action(gift.text);
  };
  return <Screen>
    <View style={[styles.row, { alignItems: 'flex-start' }]}><View style={{ width: 50, height: 50, borderRadius: 17, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }}><HeartHandshake size={24} strokeWidth={1.6} color={colors.brand} /></View><Heading title="Sow a seed" subtitle="Together, we help the ministry grow." /></View>
    <View style={styles.section}><Text style={[styles.kicker, { color: colors.muted }]}>GIFT AMOUNT · NGN · OPTIONAL</Text><View style={[styles.row, styles.input, { gap: 10 }]}><Text style={{ color: colors.brand, fontSize: 23 }}>₦</Text><TextInput accessibilityLabel="Gift amount in naira" placeholder="0.00" placeholderTextColor={colors.muted} keyboardType="decimal-pad" value={amount} onChangeText={value => { setAmount(value); setError(false); }} maxLength={14} style={{ flex: 1, minWidth: 0, minHeight: 56, color: colors.ink, fontSize: 23, fontFamily: fonts.medium }} /></View>{error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>Enter a positive amount with up to two decimal places.</Text>}</View>
    <Chips<'transfer' | 'card'> value={method} onChange={setMethod} items={[{ value: 'transfer', label: 'Bank transfer' }, { value: 'card', label: 'ATM / Card' }]} />
    {method === 'transfer' ? <>
      <View style={[styles.panel, { gap: 22, backgroundColor: colors.plum, borderWidth: 0, padding: 24 }]}><View style={styles.between}><Text style={{ color: colors.surface, fontSize: 22, fontWeight: '600' }}>{church.bank.name}</Text><Landmark size={23} strokeWidth={1.5} color="#DABBD0" /></View><View style={{ gap: 7 }}><Text style={[styles.kicker, { color: '#D4BECF', fontSize: 9 }]}>ACCOUNT NUMBER</Text><Text selectable style={{ color: colors.surface, fontSize: 28, fontWeight: '600', letterSpacing: 1 }}>{church.bank.number}</Text></View><View style={{ gap: 5 }}><Text style={[styles.kicker, { color: '#D4BECF', fontSize: 9 }]}>ACCOUNT NAME</Text><Text style={{ color: colors.surface, fontSize: 16, fontWeight: '500' }}>{church.bank.accountName}</Text></View><Button variant="outline" icon={Copy} label="Copy account number" onPress={async () => { await Clipboard.setStringAsync(church.bank.number); notify('Account number copied.'); }} /></View>
      <Body>Open your bank app, choose a transfer to Ecobank, and paste the account number. Check the account name before paying.</Body>
      <Button icon={MessageCircle} label="I have made a transfer" onPress={() => continueWith(text => whatsapp(`Hello Mount Zion. I have made a bank transfer of ${text} to the Ecobank account. Please confirm receipt.`))} />
      <Body muted>The church will confirm receipt after checking the transfer.</Body>
    </> : <>
      <View style={styles.panel}><View style={styles.row}><CreditCard size={24} color={colors.green} /><Text style={styles.heading}>Pay with a card</Text></View><Body>{checkout ? 'Continue to the church’s payment provider to enter your card details and complete your gift.' : 'Ask the church for its official card payment link on WhatsApp. Complete your gift on the payment provider’s page.'}</Body><Button icon={checkout ? ArrowUpRight : MessageCircle} label={checkout ? 'Continue to secure checkout' : 'Request card payment link'} onPress={() => continueWith(text => checkout ? openLink(checkout) : whatsapp(`Hello Mount Zion. Please send me the official secure card payment link for ${text}.`))} /></View>
      <Body muted>Card details are handled by the payment provider.</Body>
    </>}
    <View style={styles.divider} /><Button variant="quiet" label="Giving questions or receipt" icon={MessageCircle} onPress={() => whatsapp('Hello Mount Zion. I have a question about giving.')} />
  </Screen>;
}
