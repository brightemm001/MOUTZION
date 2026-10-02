import { useLocalSearchParams } from 'expo-router';
import { PlayerScreen } from '../screens/MediaScreens';
export default function PlayerRoute() {
  const { mediaId, format } = useLocalSearchParams<{ mediaId?: string; format?: string }>();
  return <PlayerScreen key={`${mediaId}:${format}`} mediaId={typeof mediaId === 'string' ? mediaId : ''} format={format === 'mp3' ? 'mp3' : 'mp4'} />;
}
