import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle2, Home, Plus, LogOut } from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { CartItem } from '../types';

interface OrderConfirmationProps {
  onReturnHome: () => void;
  onOrderMore: () => void;
  onLogOut?: () => void;
  cart: CartItem[];
  subtotal?: number;
  tax?: number;
  gratuity?: number;
  total: number;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  onReturnHome,
  onOrderMore,
  onLogOut,
  cart,
  subtotal,
  tax,
  gratuity,
  total,
}) => {
  const { theme } = useRestaurantTheme();

  const computedSubtotal = subtotal !== undefined ? subtotal : cart.reduce((acc, ci) => acc + (ci.itemTotal || 0), 0);
  const computedTax = tax !== undefined ? tax : computedSubtotal * 0.0825;
  const computedGratuity = gratuity !== undefined ? gratuity : computedSubtotal * 0.18;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.card, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
        {/* Success Circle */}
        <View style={[styles.successCircle, { borderColor: theme.secondaryColor, backgroundColor: 'rgba(229,177,58,0.1)' }]}>
          <CheckCircle2 size={64} color={theme.secondaryColor} />
        </View>

        <Text style={[styles.badgeText, { color: theme.primaryColor }]}>
          ORDER CONFIRMED
        </Text>

        <Text style={[styles.title, { color: theme.textColor }]}>
          ORDER SUBMITTED
        </Text>

        {/* Summary Breakdown */}
        {cart.length > 0 && (
          <View style={styles.orderBreakdown}>
            <Text style={[styles.breakdownHeader, { color: theme.mutedTextColor }]}>SUBMITTED ITEMS ({cart.length})</Text>
            {cart.map((ci) => (
              <View key={ci.cartItemId} style={styles.itemRow}>
                <Text style={[styles.itemQty, { color: theme.primaryColor }]}>{ci.quantity}x</Text>
                <Text style={[styles.itemName, { color: theme.textColor }]}>{ci.item.name}</Text>
                <Text style={[styles.itemPrice, { color: theme.secondaryColor }]}>${ci.itemTotal.toFixed(2)}</Text>
              </View>
            ))}

            <View style={[styles.subtotalBreakdownRow, { borderTopColor: theme.borderColor }]}>
              <Text style={[styles.breakdownLabel, { color: theme.mutedTextColor }]}>Subtotal</Text>
              <Text style={[styles.breakdownVal, { color: theme.textColor }]}>${computedSubtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.subtotalBreakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.mutedTextColor }]}>Sales Tax (8.25%)</Text>
              <Text style={[styles.breakdownVal, { color: theme.textColor }]}>${computedTax.toFixed(2)}</Text>
            </View>
            <View style={styles.subtotalBreakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.mutedTextColor }]}>Gratuity (18%)</Text>
              <Text style={[styles.breakdownVal, { color: theme.textColor }]}>${computedGratuity.toFixed(2)}</Text>
            </View>

            <View style={[styles.totalRow, { borderTopColor: theme.borderColor }]}>
              <Text style={[styles.totalLabel, { color: theme.textColor }]}>FINAL TOTAL</Text>
              <Text style={[styles.totalVal, { color: theme.secondaryColor }]}>${total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            onPress={onOrderMore}
            activeOpacity={0.85}
            style={[styles.actionBtn, styles.moreBtn, { backgroundColor: theme.primaryColor }]}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>ORDER MORE ITEMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onReturnHome}
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.homeBtn, { borderColor: theme.borderColor }]}
          >
            <Home size={20} color={theme.textColor} />
            <Text style={[styles.actionBtnText, { color: theme.textColor }]}>RETURN TO HOME</Text>
          </TouchableOpacity>
        </View>

        {/* Switch Table / End Session */}
        {onLogOut && (
          <TouchableOpacity
            onPress={onLogOut}
            activeOpacity={0.75}
            style={[styles.logOutBtn, { borderColor: theme.borderColor, backgroundColor: theme.backgroundColor }]}
          >
            <LogOut size={16} color={theme.secondaryColor} />
            <Text style={[styles.logOutBtnText, { color: theme.secondaryColor }]}>
              END SESSION & SWITCH TABLE (TABLE {theme.tableNumber})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 640,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 36,
    alignItems: 'center',
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
  },
  orderBreakdown: {
    width: '100%',
    marginBottom: 28,
    gap: 10,
  },
  breakdownHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '900',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtotalBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
  },
  moreBtn: {
    shadowColor: '#0099FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  homeBtn: {
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 20,
    width: '100%',
  },
  logOutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
