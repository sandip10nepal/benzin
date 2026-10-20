import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BenzinLogo } from './BenzinLogo';

export const BenzinAttribution: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.06)' }]} pointerEvents="none">
        <BenzinLogo size="micro" showSubtitle={false} color="#0099FF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 10 : 14,
    left: 12,
    zIndex: 20,
    opacity: 0.55,
    ...(Platform.OS === 'web' ? ({ pointerEvents: 'none' } as any) : {}),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backdropFilter: 'blur(6px)',
  },
});
