import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRestaurantTheme } from '../../theme/ThemeContext';

interface BenzinLogoProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  showSubtitle?: boolean;
  lightMode?: boolean;
}

export const BenzinLogo: React.FC<BenzinLogoProps> = ({ 
  size = 'medium', 
  showSubtitle = true,
  lightMode = false,
}) => {
  const { theme } = useRestaurantTheme();
  const isHero = size === 'hero';
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const fontSize = isHero ? 48 : isLarge ? 36 : isSmall ? 18 : 26;
  const iconSize = isHero ? 42 : isLarge ? 32 : isSmall ? 18 : 24;

  const textColor = lightMode ? '#0F172A' : (theme?.textColor || '#FFFFFF');

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        {/* BENZIN Flame/Crown Emblem */}
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="benzinGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0099FF" />
              <Stop offset="50%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#0EA5E9" />
            </LinearGradient>
          </Defs>
          <Path 
            d="M12 2C12 2 14.5 5.5 14.5 8C14.5 9.5 13.5 11 12 11C10.5 11 9.5 9.5 9.5 8C9.5 5.5 12 2 12 2Z" 
            fill="url(#benzinGradient)" 
          />
          <Path 
            d="M12 22C16.4183 22 20 18.4183 20 14C20 10.5 17.5 7.5 14.5 6.5C14.5 8.5 13.5 10 12 10C10.5 10 9.5 8.5 9.5 6.5C6.5 7.5 4 10.5 4 14C4 18.4183 7.58172 22 12 22Z" 
            fill="url(#benzinGradient)" 
            opacity={0.85}
          />
        </Svg>
        <Text style={[
          styles.text, 
          { fontSize, color: textColor }
        ]}>
          BENZIN
        </Text>
      </View>
      {showSubtitle && (
        <Text style={[styles.subtitle, { color: theme?.mutedTextColor || '#9C8C7E' }]}>
          HOSPITALITY OS
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    fontWeight: '900',
    letterSpacing: 4,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  textLight: {
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#0099FF',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  subtitleLight: {
    color: '#D97706',
  },
});
