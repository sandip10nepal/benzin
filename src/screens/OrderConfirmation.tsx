import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import {
  CheckCircle2,
  Home,
  Plus,
  LogOut,
  Clock,
  Flame,
  ChefHat,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { CartItem } from '../types';

export interface TrackingSessionData {
  orderId: string;
  trackingToken: string;
  trackingExpiresAt: string;
  customerNickname: string;
  table?: string;
  status?: string;
  fulfilledDepartments?: string[];
  order?: any;
}

interface OrderConfirmationProps {
  onReturnHome: () => void;
  onOrderMore: () => void;
  onLogOut?: () => void;
  cart: CartItem[];
  subtotal?: number;
  tax?: number;
  gratuity?: number;
  total: number;
  activeTrackingSession?: TrackingSessionData | null;
  onRefreshTracking?: () => Promise<void>;
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
  activeTrackingSession,
  onRefreshTracking,
}) => {
  const { theme } = useRestaurantTheme();
  const { isMobilePhone } = useResponsiveLayout();

  const [remainingTimeText, setRemainingTimeText] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Status mapping
  const currentRawStatus = (activeTrackingSession?.status || activeTrackingSession?.order?.status || 'pending').toLowerCase();

  const getStepIndex = (st: string): number => {
    if (st === 'fulfilled' || st === 'served' || st === 'completed') return 3;
    if (st === 'ready') return 2;
    if (st === 'preparing' || st === 'in_kitchen' || st === 'in_progress') return 1;
    return 0; // pending, sent_to_toast, accepted
  };

  const activeStep = getStepIndex(currentRawStatus);

  const steps = [
    { label: 'Received', desc: 'Sent to kitchen & bar', icon: CheckCircle2 },
    { label: 'Preparing', desc: 'Crafting in progress', icon: ChefHat },
    { label: 'Ready', desc: 'Ready for table', icon: Flame },
    { label: 'Served', desc: 'Delivered to you', icon: Sparkles },
  ];

  // 2-hour expiration countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const expAtStr = activeTrackingSession?.trackingExpiresAt || activeTrackingSession?.order?.trackingExpiresAt;
      if (!expAtStr) {
        setRemainingTimeText('Active for 2 hours');
        return;
      }
      const expTime = new Date(expAtStr).getTime();
      const diffMs = expTime - Date.now();
      if (diffMs <= 0) {
        setIsExpired(true);
        setRemainingTimeText('Tracking access expired');
      } else {
        setIsExpired(false);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        if (hours > 0) {
          setRemainingTimeText(`${hours}h ${minutes}m remaining`);
        } else {
          setRemainingTimeText(`${minutes}m ${seconds}s remaining`);
        }
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeTrackingSession]);

  const handleManualRefresh = async () => {
    if (!onRefreshTracking || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshTracking();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine items and financial summary
  const orderObj = activeTrackingSession?.order;
  const itemsList = orderObj?.items && orderObj.items.length > 0 ? orderObj.items : cart.map(ci => ({
    name: ci.item.name,
    qty: ci.quantity,
    price: ci.itemTotal,
    note: ci.specialInstructions,
    modifiers: ci.selectedModifiers,
  }));

  const orderNickname = activeTrackingSession?.customerNickname || activeTrackingSession?.order?.customerNickname || 'Guest';
  const orderId = activeTrackingSession?.orderId || activeTrackingSession?.order?.id || '';
  const tableDisplay = activeTrackingSession?.table || theme.tableNumber || '1';

  // Calculate sum of item prices as fallback
  const itemsCalculatedSubtotal = itemsList.reduce((acc: number, it: any) => {
    const p = Number(it.price !== undefined ? it.price : (it.item && it.item.price !== undefined ? it.item.price : 0)) || 0;
    const q = Number(it.qty || it.quantity || 1) || 1;
    const mods = Array.isArray(it.modifiers) ? it.modifiers : (it.selectedModifiers || []);
    const modTotal = Array.isArray(mods) ? mods.reduce((mAcc: number, m: any) => mAcc + (Number(m.price || m.price_adjustment || 0) || 0), 0) : 0;
    return acc + (p + modTotal) * q;
  }, 0);

  const displaySubtotal = (orderObj?.subtotal !== undefined && Number(orderObj.subtotal) > 0)
    ? Number(orderObj.subtotal)
    : (subtotal && subtotal > 0
      ? subtotal
      : (itemsCalculatedSubtotal > 0 ? itemsCalculatedSubtotal : cart.reduce((acc, ci) => acc + (ci.itemTotal || 0), 0)));

  const displayTax = (orderObj?.taxAmount !== undefined && Number(orderObj.taxAmount) > 0)
    ? Number(orderObj.taxAmount)
    : (tax && tax > 0 ? tax : parseFloat((displaySubtotal * 0.0825).toFixed(2)));

  const displayGratuity = (orderObj?.gratuityAmount !== undefined && Number(orderObj.gratuityAmount) > 0)
    ? Number(orderObj.gratuityAmount)
    : (gratuity && gratuity > 0 ? gratuity : parseFloat((displaySubtotal * 0.18).toFixed(2)));

  const displayTotal = (orderObj?.grandTotal !== undefined && Number(orderObj.grandTotal) > 0)
    ? Number(orderObj.grandTotal)
    : (total > 0 ? total : parseFloat((displaySubtotal + displayTax + displayGratuity).toFixed(2)));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefreshTracking ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleManualRefresh}
            tintColor={theme.secondaryColor}
          />
        ) : undefined
      }
    >
      <View style={[styles.card, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
        
        {/* Top Header Badge */}
        <View style={styles.topMetaRow}>
          <View style={styles.liveIndicator}>
            <View style={[styles.pulseDot, { backgroundColor: isExpired ? '#EF4444' : '#10B981' }]} />
            <Text style={[styles.liveText, { color: isExpired ? '#EF4444' : '#10B981' }]}>
              {isExpired ? 'TRACKING EXPIRED' : 'LIVE ORDER TRACKER'}
            </Text>
          </View>

          {onRefreshTracking && (
            <TouchableOpacity
              onPress={handleManualRefresh}
              activeOpacity={0.7}
              style={[styles.refreshBtn, { borderColor: theme.borderColor }]}
              disabled={isRefreshing}
            >
              <RefreshCw size={13} color={theme.secondaryColor} />
              <Text style={[styles.refreshText, { color: theme.secondaryColor }]}>Sync</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Guest & Order Title */}
        <Text style={[styles.orderForText, { color: theme.secondaryColor }]}>
          ORDER FOR {orderNickname.toUpperCase()}
        </Text>
        <Text style={[styles.orderNumberText, { color: theme.textColor }]}>
          Table {tableDisplay} {orderId ? `• #${orderId.replace(/^cav-/, '')}` : ''}
        </Text>

        {/* Expiration Banner if 2-hour window has expired */}
        {isExpired && (
          <View
            style={[
              styles.timerBanner,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#EF4444',
              },
            ]}
          >
            <AlertTriangle size={15} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={[styles.timerBannerText, { color: '#EF4444' }]}>
              Customer tracking access has expired (2-hour limit reached).
            </Text>
          </View>
        )}

        {/* Timeline Stepper */}
        <View style={styles.timelineContainer}>
          {steps.map((st, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;
            const IconComponent = st.icon;

            const iconColor = isCurrent
              ? theme.secondaryColor
              : isCompleted
              ? '#10B981'
              : theme.mutedTextColor;

            const stepBorderColor = isCurrent
              ? theme.secondaryColor
              : isCompleted
              ? '#10B981'
              : theme.borderColor;

            const stepBg = isCurrent
              ? 'rgba(229, 177, 58, 0.15)'
              : isCompleted
              ? 'rgba(16, 185, 129, 0.12)'
              : theme.backgroundColor;

            return (
              <View key={st.label} style={styles.stepWrapper}>
                {/* Step Connector Line */}
                {idx > 0 && (
                  <View
                    style={[
                      styles.connectorLine,
                      {
                        backgroundColor: idx <= activeStep ? '#10B981' : theme.borderColor,
                      },
                    ]}
                  />
                )}

                <View style={styles.stepCol}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      {
                        backgroundColor: stepBg,
                        borderColor: stepBorderColor,
                        borderWidth: isCurrent ? 2 : 1.5,
                      },
                    ]}
                  >
                    <IconComponent size={isMobilePhone ? 16 : 20} color={iconColor} />
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isCurrent ? theme.secondaryColor : isCompleted ? theme.textColor : theme.mutedTextColor,
                        fontWeight: isCurrent ? '800' : '600',
                      },
                    ]}
                  >
                    {st.label}
                  </Text>
                  {!isMobilePhone && (
                    <Text style={[styles.stepDesc, { color: theme.mutedTextColor }]}>
                      {st.desc}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Current Status Callout */}
        <View style={[styles.currentStatusCallout, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
          <Text style={[styles.calloutTitle, { color: theme.secondaryColor }]}>
            CURRENT STATUS: {steps[activeStep]?.label?.toUpperCase()}
          </Text>
          <Text style={[styles.calloutDesc, { color: theme.textColor }]}>
            {activeStep === 0 && 'Your order was received and routed to kitchen, bar, and hookah makers.'}
            {activeStep === 1 && 'Our staff is actively preparing your crafted items with care.'}
            {activeStep === 2 && 'Your order is ready! A server will bring it to your table shortly.'}
            {activeStep === 3 && 'Order served! Thank you for dining with us at Cavalli.'}
          </Text>
        </View>

        {/* Items Breakdown */}
        {itemsList.length > 0 && (
          <View style={styles.orderBreakdown}>
            <Text style={[styles.breakdownHeader, { color: theme.mutedTextColor }]}>
              ORDER DETAILS ({itemsList.length} ITEMS)
            </Text>

            {/* Display overall order notes if they exist */}
            {(orderObj?.notes || orderObj?.note || orderObj?.special_instructions) ? (
              <View style={[styles.overallNotesContainer, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: theme.borderColor }]}>
                <Text style={{ fontSize: 12 }}>📝</Text>
                <Text style={[styles.overallNotesText, { color: theme.textColor }]}>
                  <Text style={{ fontWeight: '700', color: theme.mutedTextColor }}>Order Notes: </Text>
                  {orderObj?.notes || orderObj?.note || orderObj?.special_instructions}
                </Text>
              </View>
            ) : null}

            {itemsList.map((it: any, idx: number) => {
              const itemTotal = Number(it.price || it.itemTotal || 0);
              const qty = Number(it.qty || it.quantity || 1);
              return (
                <View key={idx} style={[styles.itemRow, { borderBottomColor: theme.borderColor }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.itemQty, { color: theme.secondaryColor }]}>{qty}x</Text>
                      <Text style={[styles.itemName, { color: theme.textColor }]}>{it.name || it.item?.name}</Text>
                    </View>
                    {(it.note || it.notes || it.specialInstructions) ? (
                      <Text style={[styles.itemNotes, { color: theme.mutedTextColor }]}>
                        {it.note || it.notes || it.specialInstructions}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.itemPrice, { color: theme.textColor }]}>
                    ${(itemTotal * (itemTotal < 100 && it.price ? qty : 1)).toFixed(2)}
                  </Text>
                </View>
              );
            })}

            {/* Financial Summary */}
            <View style={[styles.subtotalBreakdownRow, { borderTopColor: theme.borderColor }]}>
              <Text style={[styles.breakdownLabel, { color: theme.mutedTextColor }]}>Subtotal</Text>
              <Text style={[styles.breakdownVal, { color: theme.textColor }]}>${displaySubtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.subtotalBreakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.mutedTextColor }]}>Sales Tax (8.25%)</Text>
              <Text style={[styles.breakdownVal, { color: theme.textColor }]}>${displayTax.toFixed(2)}</Text>
            </View>
            <View style={styles.subtotalBreakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.mutedTextColor }]}>Gratuity (18%)</Text>
              <Text style={[styles.breakdownVal, { color: theme.textColor }]}>${displayGratuity.toFixed(2)}</Text>
            </View>

            <View style={[styles.totalRow, { borderTopColor: theme.borderColor }]}>
              <Text style={[styles.totalLabel, { color: theme.textColor }]}>TOTAL</Text>
              <Text style={[styles.totalVal, { color: theme.secondaryColor }]}>${displayTotal.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            onPress={onOrderMore}
            activeOpacity={0.85}
            style={[styles.actionBtn, styles.moreBtn, { backgroundColor: theme.primaryColor }]}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>ORDER MORE ITEMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onReturnHome}
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.homeBtn, { borderColor: theme.borderColor }]}
          >
            <Home size={18} color={theme.textColor} />
            <Text style={[styles.actionBtnText, { color: theme.textColor }]}>WELCOME SCREEN</Text>
          </TouchableOpacity>
        </View>

        {/* Table Session Indicator (Protected) */}
        <View
          style={[styles.logOutBtn, { borderColor: theme.borderColor, backgroundColor: theme.backgroundColor }]}
        >
          <Text style={[styles.logOutBtnText, { color: theme.secondaryColor }]}>
            TABLE {tableDisplay} • ACTIVE SESSION
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 680,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
  },
  topMetaRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderForText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  orderNumberText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  timerBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  timerBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  stepWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginTop: -24,
  },
  stepCol: {
    alignItems: 'center',
    width: 68,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stepDesc: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 12,
  },
  currentStatusCallout: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  calloutTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  orderBreakdown: {
    width: '100%',
    marginBottom: 24,
  },
  breakdownHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  overallNotesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  overallNotesText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '800',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemNotes: {
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtotalBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 12,
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  actionButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  moreBtn: {},
  homeBtn: {
    borderWidth: 1,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logOutBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
