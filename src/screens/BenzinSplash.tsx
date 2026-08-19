import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Easing 
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { BenzinLogo } from '../components/ui/BenzinLogo';

interface BenzinSplashProps {
  onContinue: () => void;
}

export const BenzinSplash: React.FC<BenzinSplashProps> = ({ onContinue }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, scaleAnim, pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Ambient background glow */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Animated Brand Emblem */}
        <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <BenzinLogo size="hero" showSubtitle={false} />
        </Animated.View>

        <Text style={styles.tagline}>BENZIN TABLE PLATFORM</Text>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onContinue}
          style={styles.startBtn}
        >
          <Text style={styles.startBtnText}>PAIR TABLE DEVICE</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.versionText}>
          BenzinOS v3.4
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070504',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -150,
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(0, 153, 255, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(229, 177, 58, 0.06)',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 620,
  },
  logoWrapper: {
    marginBottom: 24,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#0099FF',
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0099FF',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 22,
    shadowColor: '#0099FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 28,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  versionText: {
    fontSize: 11,
    color: '#6E5D50',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
