import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { church } from '../config/church';
import { allowedExternalUrl } from './url-policy';

export async function openLink(url: string): Promise<void> {
  const safe = allowedExternalUrl(url, church);
  if (!safe) throw new Error('This link is not supported.');
  if (safe.startsWith('tel:') || Platform.OS === 'web') await Linking.openURL(safe);
  else await WebBrowser.openBrowserAsync(safe, { toolbarColor: '#FFFFFF', controlsColor: '#A24188' });
}

export async function whatsapp(message: string): Promise<void> {
  if (typeof message !== 'string' || message.length > 6000 || !/^\d{10,15}$/.test(church.whatsapp)) throw new Error('This message is not supported.');
  const web = `https://wa.me/${church.whatsapp}?text=${encodeURIComponent(message)}`;
  if (Platform.OS !== 'web') {
    const native = `whatsapp://send?phone=${church.whatsapp}&text=${encodeURIComponent(message)}`;
    try { await Linking.openURL(native); return; } catch { /* Use the web handoff when WhatsApp is not installed. */ }
  }
  await openLink(web);
}

export function directions(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
