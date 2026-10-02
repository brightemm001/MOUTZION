export const colors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  ink: '#2B2330',
  muted: '#7C7580',
  line: '#ECE7EB',
  brand: '#963B7E',
  brandSoft: '#F4EAF1',
  plum: '#402738',
  green: '#47705E',
  greenSoft: '#EDF3EF',
  gold: '#8E6B36',
  goldSoft: '#F7F0E4',
  danger: '#B73535',
};

export const fonts = {
  regular: 'Inter', medium: 'InterMedium', semibold: 'InterSemiBold', bold: 'InterBold',
  serif: 'NotoSerif', serifItalic: 'NotoSerifItalic',
};
export const serif = fonts.serif;

export const fontAssets = {
  Inter: require('../assets/fonts/Inter_400Regular.ttf'),
  InterMedium: require('../assets/fonts/Inter_500Medium.ttf'),
  InterSemiBold: require('../assets/fonts/Inter_600SemiBold.ttf'),
  InterBold: require('../assets/fonts/Inter_700Bold.ttf'),
  NotoSerif: require('../assets/fonts/NotoSerif_400Regular.ttf'),
  NotoSerifItalic: require('../assets/fonts/NotoSerif_400Regular_Italic.ttf'),
};

export const images: Record<string, number> = {
  logo: require('../assets/logo.png'),
  'pastor-preaching': require('../assets/church/pastor-preaching.jpg'),
  'prayer-gathering': require('../assets/church/prayer-gathering.jpg'),
  revival: require('../assets/church/revival.jpg'),
  'city-of-prayer': require('../assets/church/city-of-prayer.jpg'),
  pastor: require('../assets/church/pastor.jpg'),
  'womens-ministry': require('../assets/church/womens-ministry.jpg'),
};
