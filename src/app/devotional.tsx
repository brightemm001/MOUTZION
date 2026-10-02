import { useLocalSearchParams } from 'expo-router';
import DevotionalScreen from '../screens/DevotionalScreen';
import { isDateKey } from '../services/preferences';
export default function DevotionalRoute() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const valid = isDateKey(date);
  return <DevotionalScreen key={valid ? date : 'today'} date={valid ? date : undefined} />;
}
