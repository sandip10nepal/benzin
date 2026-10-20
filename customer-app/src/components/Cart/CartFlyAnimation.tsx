import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

interface CartFlyAnimationProps {
  itemName: string;
  onComplete: () => void;
}

export const CartFlyAnimation: React.FC<CartFlyAnimationProps> = ({ itemName, onComplete }) => {
  const { isMobilePhone: isMobile } = useResponsiveLayout();
  
  // Animation values
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Pop up in center
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      // 2. Pause for a moment to let user read
      setTimeout(() => {
        // 3. Fly to cart
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.2,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            // Fly down to bottom right for mobile, top right for desktop
            toValue: isMobile ? 350 : -350,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          }),
          Animated.timing(translateX, {
            toValue: isMobile ? 150 : 300,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          })
        ]).start(() => {
          onComplete();
        });
      }, 500);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.container}>
        <Animated.View style={[
          styles.pill,
          {
            opacity,
            transform: [
              { scale },
              { translateY },
              { translateX }
            ]
          }
        ]}>
          <Text style={styles.icon}>🛍️</Text>
          <Text style={styles.text} numberOfLines={1}>+1 {itemName}</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981', // green success
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    gap: 8,
    maxWidth: 250,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  }
});
