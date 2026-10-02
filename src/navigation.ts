import { useRouter, type Href } from 'expo-router';
import type { RootStackParams, TabParams } from './types';

const tabs: Record<keyof TabParams, string> = { Home: '/', Hymns: '/hymns', Media: '/media', Daily: '/daily', More: '/more' };
const paths: Record<Exclude<keyof RootStackParams, 'Main'>, string> = {
  Hymn: '/hymn', Devotional: '/devotional', Prayers: '/prayers', Player: '/player', Giving: '/giving', Connect: '/connect', Visit: '/visit', Saved: '/saved', Downloads: '/downloads', Settings: '/settings', Privacy: '/privacy', Sources: '/sources',
};

function destination<K extends keyof RootStackParams>(screen: K, params?: RootStackParams[K]): Href {
  if (screen === 'Main') return (tabs[(params as RootStackParams['Main'])?.screen || 'Home']) as Href;
  return { pathname: paths[screen as Exclude<K, 'Main'>], params } as Href;
}

export function useAppNavigation() {
  const router = useRouter();
  return {
    navigate<K extends keyof RootStackParams>(screen: K, ...args: undefined extends RootStackParams[K] ? [params?: RootStackParams[K]] : [params: RootStackParams[K]]) {
      router.navigate(destination(screen, args[0]));
    },
    replace<K extends keyof RootStackParams>(screen: K, ...args: undefined extends RootStackParams[K] ? [params?: RootStackParams[K]] : [params: RootStackParams[K]]) {
      router.replace(destination(screen, args[0]));
    },
  };
}
