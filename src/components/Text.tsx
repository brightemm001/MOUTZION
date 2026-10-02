import React, { forwardRef } from 'react';
import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';
import { fonts } from '../theme';

// Static font faces render consistently in Expo Go, Android builds, and the browser.
export const Text = forwardRef<React.ComponentRef<typeof NativeText>, TextProps>(function Text({ style, ...props }, ref) {
  const flattened = StyleSheet.flatten(style);
  const weight = Number(flattened?.fontWeight || 400);
  const family = flattened?.fontFamily || (weight >= 700 ? fonts.bold : weight >= 600 ? fonts.semibold : weight >= 500 ? fonts.medium : fonts.regular);
  return <NativeText ref={ref} {...props} style={[{ color: '#2B2330', fontFamily: fonts.regular }, style, { fontFamily: family, fontWeight: 'normal' }]} />;
});
