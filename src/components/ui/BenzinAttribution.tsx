import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BenzinLogo } from './BenzinLogo';
import { useRestaurantTheme } from '../../theme/ThemeContext';

export const BenzinAttribution: React.FC = () => {
  const { theme } = useRestaurantTheme();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.08)' }]}>
        <BenzinLogo size="micro" showSubtitle={false} color="#0099FF" />
        <Text style={[styles.text, { color: theme.mutedTextColor || '#948375' }]}>
          PLATFORM
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 12 : 16,
    left: 14,
    zIndex: 40,
    opacity: 0.75,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backdropFilter: 'blur(8px)',
  },
  text: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
