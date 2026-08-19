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
        {/* Authentic Benzene Hexagon Structure Emblem */}
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="benzinBenzeneGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0099FF" />
              <Stop offset="50%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#E5B13A" />
            </LinearGradient>
          </Defs>
          {/* Outer Benzene Hexagon Ring */}
          <Path 
            d="M12 2.5 L20.22 7.25 V16.75 L12 21.5 L3.78 16.75 V7.25 Z" 
            stroke="url(#benzinBenzeneGrad)" 
            strokeWidth="2.2" 
            strokeLinejoin="round"
            fill="rgba(0,153,255,0.06)" 
          />
          {/* Inner Aromatic Circle */}
          <Circle 
            cx="12" 
            cy="12" 
            r="5" 
            stroke="url(#benzinBenzeneGrad)" 
            strokeWidth="1.8" 
            fill="none" 
          />
          {/* Carbon Vertex Nodes */}
          <Circle cx="12" cy="2.5" r="1.6" fill="#38BDF8" />
          <Circle cx="20.22" cy="7.25" r="1.6" fill="#38BDF8" />
          <Circle cx="20.22" cy="16.75" r="1.6" fill="#38BDF8" />
          <Circle cx="12" cy="21.5" r="1.6" fill="#E5B13A" />
          <Circle cx="3.78" cy="16.75" r="1.6" fill="#E5B13A" />
          <Circle cx="3.78" cy="7.25" r="1.6" fill="#38BDF8" />
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
