import { useLocalSearchParams } from 'expo-router';
import { HymnDetailScreen } from '../screens/HymnScreens';
export default function HymnRoute() {
  const { hymnKey } = useLocalSearchParams<{ hymnKey?: string }>();
  return <HymnDetailScreen hymnKey={typeof hymnKey === 'string' ? hymnKey : ''} />;
}
