import { useLocalSearchParams } from 'expo-router';
import ConnectScreen from '../screens/ConnectScreen';
export default function ConnectRoute() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  return <ConnectScreen key={kind} kind={kind === 'testimony' ? 'testimony' : 'prayer'} />;
}
