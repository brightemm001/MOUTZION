import React from 'react';
import { View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { Body, Button, styles } from './ui';
import { Text } from './Text';
import { useApp } from '../state/AppState';
import { dateLabel } from '../data/content';

export function ContentUpdates() {
  const { contentBusy, contentError, contentSavedAt, refreshContent } = useApp();
  return <View style={{ gap: 7 }}>
    <Button small variant="quiet" icon={RefreshCw} label={contentBusy ? 'Checking for new content…' : 'Refresh church content'} disabled={contentBusy} onPress={refreshContent} />
    {contentError && <Body muted>{contentError}</Body>}
    {!contentError && !contentBusy && contentSavedAt && <Body muted>Content saved for offline use.</Body>}
  </View>;
}
export function UpcomingEvents({ limit = 200 }: { limit?: number }) {
  const { content, preferences, today } = useApp();
  const events = (content.events || []).filter(event => event.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, limit);
  if (!events.length) return null;
  return <View style={styles.section}><Text style={styles.heading}>Upcoming events</Text>{events.map(event => <View key={event.id} style={styles.panel}>
    <Text style={styles.heading}>{event.title[preferences.language]}</Text>
    <Body muted>{dateLabel(event.date)} · {event.time} WAT</Body><Body>{event.location}</Body>
    {!!event.description[preferences.language] && <Body>{event.description[preferences.language]}</Body>}
  </View>)}</View>;
}
