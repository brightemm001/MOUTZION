import { ContentUpdates, UpcomingEvents } from '../components/ContentUpdates';
import React from 'react';
import { Image, View } from 'react-native';
import { MapPin, MessageCircle } from 'lucide-react-native';
import { Body, Button, Heading, Screen, styles } from '../components/ui';
import { Text } from '../components/Text';
import { locations, services } from '../config/church';
import { directions, openLink, whatsapp } from '../services/links';
import { colors, images } from '../theme';

export default function VisitScreen() {
  return <Screen>
    <Heading title="Worship with us" subtitle="Okuku and Ikirun · Osun State, Nigeria" />
    <ContentUpdates /><UpcomingEvents />
    <Text style={styles.heading}>Weekly services</Text>
    {['Okuku', 'Ikirun'].map(branch => <View key={branch} style={[styles.panel, { gap: 18 }]}><View style={[styles.row, { gap: 7 }]}><MapPin size={14} color={colors.brand} /><Text style={styles.kicker}>{branch === 'Okuku' ? 'Okuku headquarters' : 'Ikirun branch'}</Text></View>{services.filter(service => service.branch === branch).map(service => <View key={service.title} style={{ gap: 6, paddingVertical: 5 }}><Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{service.title}</Text><Text style={[styles.body, { fontSize: 13, color: colors.brand }]}>{service.day} · {service.time}</Text>{!!service.note && <Body muted>{service.note}</Body>}</View>)}</View>)}
    <Text style={styles.heading}>Our locations</Text>
    {locations.map(location => <View key={location.name} style={{ borderColor: colors.line, borderWidth: 1, borderRadius: 22, backgroundColor: colors.surface, overflow: 'hidden' }}><Image source={images[location.image]} style={{ width: '100%', height: 210 }} resizeMode="cover" accessibilityLabel={location.name} /><View style={{ padding: 20, gap: 14 }}><Text style={styles.heading}>{location.name}</Text><Body>{location.address}</Body><Button small variant="outline" icon={MapPin} label="Get directions" onPress={() => openLink(directions(location.address))} /></View></View>)}
    <Body muted>Map links search the written addresses. Ask the church for a precise pin before travelling.</Body>
    <Button icon={MessageCircle} label="Ask about visiting" onPress={() => whatsapp('Hello Mount Zion. I would like to plan a visit. Please send me the location pin and service details.')} />
  </Screen>;
}
