import { checkoutUrl, websiteOrigin } from '../services/url-policy';

export const church = {
  name: 'Mount Zion',
  fullName: 'Mount Zion Holiness of Christ Evangelical World Outreach',
  website: websiteOrigin(process.env.EXPO_PUBLIC_WEBSITE_URL) || 'https://mountzion-lemon.vercel.app',
  whatsapp: '2349154494093',
  phone: '09154494093',
  bank: { name: 'Ecobank', number: '2093029275', accountName: 'Afolabi Olaniyi' },
  cardCheckoutUrl: checkoutUrl(process.env.EXPO_PUBLIC_CARD_CHECKOUT_URL) || '',
  facebook: 'https://web.facebook.com/olaniyi.olawumi.184',
  tiktok: 'https://www.tiktok.com/@virtous.women25',
  hymnApi: 'https://hymnize.com/api',
};

export const services = [
  { branch: 'Okuku', title: 'Sunday worship', day: 'Sunday', time: '7:00 - 10:00 AM', note: "Workers' meeting: 6:30 AM", weekday: 0, hour: 7 },
  { branch: 'Okuku', title: 'Hour of Power and Redemption', day: 'Thursday', time: '4:00 - 6:30 PM', note: '', weekday: 4, hour: 16 },
  { branch: 'Okuku', title: 'Hour of Mercy', day: 'Saturday', time: '6:00 - 7:00 AM', note: '', weekday: 6, hour: 6 },
  { branch: 'Ikirun', title: 'Sunday worship', day: 'Sunday', time: '7:00 - 9:00 AM', note: '', weekday: 0, hour: 7 },
  { branch: 'Ikirun', title: 'Hour of Mercy', day: 'Friday', time: '10:00 AM - 12:00 PM', note: '', weekday: 5, hour: 10 },
];

export const locations = [
  { name: 'Okuku headquarters', address: 'Behind Oyinlola Comprehensive High School, Okuku, Osun State.', image: 'prayer-gathering' },
  { name: 'Mount Zion City of Prayer', address: 'KM 18 Osogbo-Offa Expressway, Osun State, Nigeria.', image: 'city-of-prayer' },
  { name: 'Ikirun branch', address: 'Around Ireti Hospital, Eweta, Ikirun, Osun State.', image: 'revival' },
];
