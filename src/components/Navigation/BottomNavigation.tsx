import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';

interface BottomNavigationProps {
  onBack?: () => void;
  backText?: string;
  onPrimaryAction?: () => void;
  primaryText?: string;
  primaryIcon?: 'next' | 'check' | 'cart';
  stepDotsCount?: number;
  activeStepIndex?: number;
  totalCartSubtotal?: number;
  disabledPrimary?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onBack,
  backText = 'BACK',
  onPrimaryAction,
  primaryText = 'CONTINUE',
  primaryIcon = 'next',
  stepDotsCount,
  activeStepIndex = 0,
  totalCartSubtotal,
  disabledPrimary = false,
}) => {
  const { theme } = useRestaurantTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.cardColor, borderTopColor: theme.borderColor }]}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={onBack}
        disabled={!onBack}
        activeOpacity={0.7}
        style={[
          styles.backBtn,
          { borderColor: theme.borderColor, backgroundColor: 'rgba(255,255,255,0.04)' },
          !onBack && { opacity: 0.3 },
        ]}
      >
        <ArrowLeft size={20} color={theme.textColor} />
        <Text style={[styles.backText, { color: theme.textColor }]}>{backText}</Text>
      </TouchableOpacity>

      {/* Center: Progress Dots or Subtotal Tracker */}
      <View style={styles.centerArea}>
        {stepDotsCount && stepDotsCount > 0 ? (
          <View style={styles.dotsRow}>
            {Array.from({ length: stepDotsCount }).map((_, idx) => {
              const isActive = idx === activeStepIndex;
              const isPast = idx < activeStepIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    isActive && [styles.activeDot, { backgroundColor: theme.primaryColor }],
                    isPast && { backgroundColor: theme.secondaryColor },
                    !isActive && !isPast && { backgroundColor: 'rgba(255,255,255,0.15)' },
                  ]}
                />
              );
            })}
          </View>
        ) : totalCartSubtotal !== undefined && totalCartSubtotal > 0 ? (
          <View style={styles.subtotalPill}>
            <Text style={[styles.subtotalLabel, { color: theme.mutedTextColor }]}>ORDER TOTAL</Text>
            <Text style={[styles.subtotalVal, { color: theme.secondaryColor }]}>
              ${totalCartSubtotal.toFixed(2)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Primary Action Button */}
      {onPrimaryAction && primaryText ? (
        <TouchableOpacity
          onPress={onPrimaryAction}
          disabled={disabledPrimary}
          activeOpacity={0.85}
          style={[
            styles.primaryBtn,
            { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5 },
            disabledPrimary && { opacity: 0.4 },
          ]}
        >
          <Text style={[styles.primaryText, { color: '#22C55E' }]}>{primaryText}</Text>
          {primaryIcon === 'next' && <ArrowRight size={20} color="#22C55E" />}
          {primaryIcon === 'check' && <Check size={20} color="#22C55E" />}
          {primaryIcon === 'cart' && <ShoppingBag size={20} color="#22C55E" />}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    width: '92%',
    maxWidth: 520,
    alignSelf: 'center',
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    zIndex: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 38,
  },
  backText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  centerArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 20,
    height: 8,
    borderRadius: 4,
  },
  subtotalPill: {
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtotalVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    minHeight: 38,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
