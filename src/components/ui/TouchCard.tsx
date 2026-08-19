import React, { useRef } from 'react';
import { 
  TouchableOpacity, 
  Animated, 
  StyleSheet, 
  ViewStyle, 
  GestureResponderEvent 
} from 'react-native';

interface TouchCardProps {
  onPress: (event: GestureResponderEvent) => void;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  activeBorderColor?: string;
  disabled?: boolean;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  onPress,
  children,
  style,
  activeBorderColor,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 150,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.card,
          activeBorderColor ? { borderColor: activeBorderColor, borderWidth: 1.5 } : null,
          { width: '100%', height: '100%' },
        ]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
});
