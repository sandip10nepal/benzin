import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'normal' | 'large';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  size = 'normal',
}) => {
  const { theme } = useRestaurantTheme();
  const isLarge = size === 'large';
  const buttonSize = isLarge ? 48 : 36;
  const iconSize = isLarge ? 22 : 16;
  const fontSize = isLarge ? 20 : 16;

  return (
    <View style={[styles.container, { borderColor: theme.borderColor, backgroundColor: theme.cardColor }]}>
      <TouchableOpacity
        onPress={onDecrease}
        activeOpacity={0.7}
        style={[
          styles.button,
          { width: buttonSize, height: buttonSize, backgroundColor: 'rgba(255,255,255,0.06)' },
        ]}
      >
        <Minus size={iconSize} color={theme.textColor} />
      </TouchableOpacity>

      <Text style={[styles.quantityText, { fontSize, color: theme.textColor }]}>
        {quantity}
      </Text>

      <TouchableOpacity
        onPress={onIncrease}
        activeOpacity={0.7}
        style={[
          styles.button,
          { width: buttonSize, height: buttonSize, backgroundColor: theme.primaryColor },
        ]}
      >
        <Plus size={iconSize} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 12,
  },
  button: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
});
