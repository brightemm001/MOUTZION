import { ContentUpdates } from '../components/ContentUpdates';
import React, { useEffect, useState } from 'react';
import { AppState, Image, ImageBackground, Modal, Platform, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { useAppNavigation } from '../navigation';
import { useEvent } from 'expo';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Download, Headphones, Pause, Play, RefreshCw, Share2, SkipBack, SkipForward, Trash2, Video, X } from 'lucide-react-native';
import { Body, Button, Chips, Empty, Heading, IconButton, Loading, Screen, styles } from '../components/ui';
import { Text } from '../components/Text';
import { useApp, useContent } from '../state/AppState';
import { exportDownload, mediaUrl, validDownload } from '../services/downloads';
import { openLink } from '../services/links';
import { colors, images } from '../theme';
import type { DownloadedMedia, MediaCategory, MediaFormat, MediaItem } from '../types';

const categoryNames: Record<MediaCategory, string> = { sermon: 'Sermon', prayer: 'Prayer', praise: 'Praise', gathering: 'Gathering' };

export function DownloadProgress() {
  const { activeDownload, cancelDownload } = useApp();
  if (!activeDownload) return null;
  return <View style={[styles.panel, { padding: 12, gap: 8 }]}>
    <View style={styles.between}><View style={{ flex: 1, gap: 3 }}><Text style={[styles.muted, { color: colors.green }]}>Downloading · {Math.round(activeDownload.progress * 100)}%</Text><Text numberOfLines={1} style={{ color: colors.ink, fontSize: 13 }}>{activeDownload.title}</Text></View><IconButton icon={X} label="Cancel download" onPress={cancelDownload} /></View>
    <View style={{ backgroundColor: colors.line, height: 4, borderRadius: 2, overflow: 'hidden' }}><View style={{ height: 4, width: `${Math.round(activeDownload.progress * 100)}%`, backgroundColor: colors.green }} /></View>
  </View>;
}

function MediaActions({ item }: { item: MediaItem }) {
  const navigation = useAppNavigation();
  const { download, activeDownload, preferences } = useApp();
  return <View style={{ gap: 10 }}>
    <View style={styles.wrap}><Button small icon={Play} label="Watch video" onPress={() => navigation.navigate('Player', { mediaId: item.id, format: 'mp4' })} /><Button small variant="outline" icon={Headphones} label="Listen" onPress={() => navigation.navigate('Player', { mediaId: item.id, format: 'mp3' })} /></View>
    <View style={[styles.wrap, { gap: 0, marginHorizontal: -10 }]}>{(['mp3', 'mp4'] as const).map(format => <Button key={format} small variant="quiet" icon={Download} disabled={!!activeDownload} label={preferences.downloads.some(d => d.key === `${item.id}:${format}`) ? `${format.toUpperCase()} saved` : `Download ${format.toUpperCase()}`} onPress={() => download(item, format)} />)}</View>
  </View>;
}

export function MediaScreen() {
  const content = useContent();
  const [category, setCategory] = useState<MediaCategory | 'all'>('all');
  const navigation = useAppNavigation();
  const items = content.media.filter(item => category === 'all' || item.category === category);
  return <Screen>
    <View style={styles.between}><Heading title="The media library" subtitle="A message for your every day." /><IconButton icon={Download} label="Open downloads" onPress={() => navigation.navigate('Downloads')} /></View>
    <ContentUpdates />
    <Chips<MediaCategory | 'all'> scroll items={[{ value: 'all', label: 'All' }, { value: 'prayer', label: 'Prayer' }, { value: 'sermon', label: 'Sermons' }, { value: 'praise', label: 'Praise' }, { value: 'gathering', label: 'Gatherings' }]} value={category} onChange={setCategory} />
    <DownloadProgress />
    <View style={styles.between}><Text style={styles.kicker}>{category === 'all' ? 'FROM OUR CHURCH' : `${categoryNames[category]} COLLECTION`}</Text><Text style={[styles.muted, { fontSize: 11 }]}>{items.length} recordings</Text></View>
    {!items.length && <Body muted>No recordings in this collection yet.</Body>}
    {items.map(item => <View key={item.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, overflow: 'hidden' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Watch ${item.title}`} onPress={() => navigation.navigate('Player', { mediaId: item.id, format: 'mp4' })}>
        <ImageBackground source={images[item.poster]} style={{ width: '100%', height: 208 }} resizeMode="cover" accessibilityLabel={item.title}><LinearGradient colors={['transparent', '#2B233095']} style={{ flex: 1, justifyContent: 'flex-end', padding: 18 }}><View style={styles.between}><View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFFFFFE8', borderRadius: 8 }}><Text style={{ fontSize: 9, fontWeight: '700', color: colors.plum, textTransform: 'uppercase', letterSpacing: 1 }}>{categoryNames[item.category]}</Text></View><View style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface }}><Play size={18} color={colors.brand} fill={colors.brand} /></View></View></LinearGradient></ImageBackground>
      </Pressable>
      <View style={{ padding: 20, gap: 12 }}><Text style={[styles.heading, { fontSize: 19 }]}>{item.title}</Text><MediaActions item={item} /></View>
    </View>)}
    <Body muted>Downloads use descriptive file names. Audio and video need an internet connection until saved on your device.</Body>
  </Screen>;
}

function VideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  const focused = useIsFocused();
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (player.status !== 'readyToPlay' && player.status !== 'error') timer = setTimeout(() => setTimedOut(true), 20000);
    const subscription = player.addListener('statusChange', event => {
      clearTimeout(timer);
      setTimedOut(false);
      if (event.status !== 'readyToPlay' && event.status !== 'error') timer = setTimeout(() => setTimedOut(true), 20000);
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [player]);
  useEffect(() => { if (!focused) player.pause(); }, [focused, player]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') player.pause(); });
    return () => subscription.remove();
  }, [player]);
  return <View style={{ gap: 12 }}>
    <VideoView player={player} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} allowsPictureInPicture={false} style={{ width: '100%', height: 420, backgroundColor: '#221C25', borderRadius: 20 }} />
    {status === 'loading' && !timedOut && <Loading text="Loading video..." />}
    {(status === 'error' || timedOut) && <Body muted>The video could not load. Check your connection, then try again.</Body>}
  </View>;
}

const time = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;

function AudioPlayer({ uri, item }: { uri: string; item: MediaItem }) {
  const { notify } = useApp();
  const player = useAudioPlayer(uri, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const focused = useIsFocused();
  const [timedOut, setTimedOut] = useState(false);
  const [trackWidth, setTrackWidth] = useState(1);
  useEffect(() => { if (!focused) player.pause(); }, [focused, player]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') player.pause(); });
    return () => subscription.remove();
  }, [player]);
  useEffect(() => { const timer = setTimeout(() => setTimedOut(true), 20000); return () => clearTimeout(timer); }, []);
  const seek = (seconds: number) => player.seekTo(Math.max(0, Math.min(status.duration, seconds))).catch(() => notify('The audio position could not change. Try reloading the recording.'));
  return <View style={{ gap: 20 }}>
    <Image source={images[item.poster]} style={{ width: '100%', height: 290, borderRadius: 24 }} resizeMode="cover" accessibilityLabel={item.title} />
    <Pressable accessibilityRole="adjustable" accessibilityLabel="Audio position" accessibilityValue={{ min: 0, max: Math.round(status.duration), now: Math.round(status.currentTime) }} accessibilityActions={[{ name: 'increment', label: 'Forward 15 seconds' }, { name: 'decrement', label: 'Back 15 seconds' }]}
      onAccessibilityAction={event => { void seek(status.currentTime + (event.nativeEvent.actionName === 'increment' ? 15 : -15)); }}
      disabled={!status.isLoaded} onLayout={event => setTrackWidth(event.nativeEvent.layout.width)} onPress={event => { void seek((event.nativeEvent.locationX / trackWidth) * status.duration); }}
      style={{ height: 32, justifyContent: 'center' }}><View style={{ height: 6, backgroundColor: colors.line, borderRadius: 3, overflow: 'hidden' }}><View style={{ height: 6, width: `${status.duration ? Math.min(100, status.currentTime / status.duration * 100) : 0}%`, backgroundColor: colors.brand }} /></View></Pressable>
    <View style={styles.between}><Body muted>{time(status.currentTime)}</Body><Body muted>{time(status.duration)}</Body></View>
    <View style={[styles.row, { justifyContent: 'center', gap: 20 }]}><IconButton icon={SkipBack} label="Back 15 seconds" disabled={!status.isLoaded} onPress={() => seek(status.currentTime - 15)} />
      <Button icon={status.playing ? Pause : Play} label={status.playing ? 'Pause audio' : 'Play audio'} disabled={!status.isLoaded} onPress={async () => { if (status.playing) player.pause(); else { if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) await seek(0); player.play(); } }} />
      <IconButton icon={SkipForward} label="Forward 15 seconds" disabled={!status.isLoaded} onPress={() => seek(status.currentTime + 15)} /></View>
    {!status.isLoaded && (timedOut ? <Body muted>The audio has not loaded. Check your connection and try again.</Body> : <Loading text="Loading audio..." />)}
    {status.isLoaded && status.isBuffering && <Body muted>Buffering audio...</Body>}
  </View>;
}

export function PlayerScreen({ mediaId, format }: { mediaId: string; format: MediaFormat }) {
  const content = useContent();
  const { preferences } = useApp();
  const [savedAtLaunch] = useState(() => preferences.downloads.find(d => d.mediaId === mediaId && d.format === format));
  const [localUri, setLocalUri] = useState<string | undefined>();
  const [checked, setChecked] = useState(!savedAtLaunch);
  useEffect(() => {
    let mounted = true;
    if (savedAtLaunch) void validDownload(savedAtLaunch).then(valid => { if (mounted && valid) setLocalUri(savedAtLaunch.uri); }).catch(() => undefined).finally(() => { if (mounted) setChecked(true); });
    return () => { mounted = false; };
  }, [savedAtLaunch]);
  const [attempt, setAttempt] = useState(0);
  const item = content.media.find(entry => entry.id === mediaId);
  if (!item) return <Screen><Empty icon={Video} title="Media unavailable" description="This recording could not be found." /></Screen>;
  if (!checked) return <Screen><Loading text="Opening your saved recording..." /></Screen>;
  const uri = localUri || mediaUrl(item, format);
  return <Screen>
    <Text style={styles.kicker}>{categoryNames[item.category]} · {format === 'mp3' ? 'Audio' : 'Video'}{localUri ? ' · Saved on device' : ''}</Text>
    <Heading title={item.title} />
    {format === 'mp4' ? <VideoPlayer key={attempt} uri={uri} /> : <AudioPlayer key={attempt} uri={uri} item={item} />}
    <View style={styles.wrap}><Button small variant="outline" icon={RefreshCw} label="Reload player" onPress={() => setAttempt(n => n + 1)} />{!localUri && <Button small variant="quiet" label="Open recording" onPress={() => openLink(uri)} />}</View>
    <View style={styles.divider} /><MediaActions item={item} /><DownloadProgress />
  </Screen>;
}

export function DownloadsScreen() {
  const content = useContent();
  const navigation = useAppNavigation();
  const { preferences, removeDownload, notify } = useApp();
  const [pendingDelete, setPendingDelete] = useState<DownloadedMedia | null>(null);
  return <Screen>
    <Heading title="Downloads" subtitle="Recordings saved on this device." /><DownloadProgress />
    {!preferences.downloads.length && <Empty icon={Download} title="No recordings saved yet" description={Platform.OS === 'web' ? 'In the browser, files go to your usual Downloads folder. In the Android app, they appear here for offline playback.' : 'Use Download MP3 or Download MP4 in Media to listen or watch offline.'} action={<Button label="Browse media" onPress={() => navigation.navigate('Main', { screen: 'Media' })} />} />}
    {preferences.downloads.map(download => {
      const item = content.media.find(entry => entry.id === download.mediaId);
      return <View key={download.key} style={styles.panel}><View style={styles.between}><View style={{ flex: 1, gap: 5 }}><Text style={styles.heading}>{item?.title || download.fileName}</Text><Body muted>{download.format.toUpperCase()} · {(download.bytes / 1024 / 1024).toFixed(1)} MB</Body></View><IconButton icon={Trash2} label={`Delete ${download.fileName}`} onPress={() => setPendingDelete(download)} /></View>
        <View style={styles.wrap}><Button small icon={Play} label="Play offline" disabled={!item} onPress={async () => { if (!await validDownload(download)) { notify('This file is missing. Please download it again.'); return; } navigation.navigate('Player', { mediaId: download.mediaId, format: download.format }); }} /><Button small variant="outline" icon={Share2} label="Save or share file" onPress={() => exportDownload(download)} /></View><Body muted>{download.fileName}</Body>
      </View>;
    })}
    <Modal transparent visible={!!pendingDelete} animationType="fade" onRequestClose={() => setPendingDelete(null)}><View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000055' }}><View style={[styles.panel, { width: '100%', maxWidth: 480 }]}><Text style={styles.heading}>Remove this download?</Text><Body>You can download the recording again from Media.</Body><Button label="Remove from device" onPress={async () => { if (pendingDelete) await removeDownload(pendingDelete); setPendingDelete(null); }} /><Button variant="outline" label="Keep recording" onPress={() => setPendingDelete(null)} /></View></View></Modal>
  </Screen>;
}
