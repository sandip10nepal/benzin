import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  TextInput
} from 'react-native';
import { X, Trash2, ArrowRight, ShoppingBag, Sparkles, Clock, Plus } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { CartItem, MenuItem, SelectedModifier } from '../../types';
import { QuantitySelector } from '../ui/QuantitySelector';
import { MENU_IMAGES, getItemImageSource } from '../../data/menu_images';
import { getMissingRequiredModifierGroup } from '../../utils/modifierUtils';

interface CartDrawerProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  gratuity?: number;
  total: number;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onSelectItem?: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem, qty: number, modifiers: SelectedModifier[], notes?: string) => void;
  onPlaceOrder: (orderNotes?: string) => void;
  activeTrackingSession?: any | null;
  onOpenTrackOrder?: () => void;
  allMenuItems?: MenuItem[];
  orderNotes?: string;
  onOrderNotesChange?: (notes: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  visible,
  onClose,
  cart,
  subtotal,
  tax,
  gratuity,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onSelectItem,
  onAddToCart,
  onPlaceOrder,
  activeTrackingSession,
  onOpenTrackOrder,
  allMenuItems = [],
  orderNotes = '',
  onOrderNotesChange,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const isMobile = layout.isMobilePhone;

  const [internalNotes, setInternalNotes] = useState<string>('');
  const [showDessertModal, setShowDessertModal] = useState<boolean>(false);
  const [hasDismissedDessert, setHasDismissedDessert] = useState<boolean>(false);

  const effectiveNotes = orderNotes !== undefined && orderNotes !== '' ? orderNotes : internalNotes;
  const setEffectiveNotes = (val: string) => {
    if (onOrderNotesChange) onOrderNotesChange(val);
    setInternalNotes(val);
  };

  const recommendations = useMemo(() => {
    if (!allMenuItems || allMenuItems.length === 0) return [];
    const desserts = allMenuItems.filter(i => 
      (i.category || '').toLowerCase().includes('dessert') || 
      (i.subcategory || '').toLowerCase().includes('dessert') || 
      /cake|baklava|knafeh|sweet|brownie|ice cream/i.test(i.name || '')
    );
    const coldDrinks = allMenuItems.filter(i => 
      /iced|cold|smoothie|shake|lemonade|red bull|mojito/i.test(i.name || '')
    );
    const warmDrinks = allMenuItems.filter(i => 
      /chai|tea|coffee|latte|cappuccino|espresso/i.test(i.name || '')
    );

    const recs: MenuItem[] = [];
    if (desserts.length > 0) recs.push(desserts[0]);
    if (coldDrinks.length > 0) recs.push(coldDrinks[0]);
    if (warmDrinks.length > 0) recs.push(warmDrinks[0]);
    if (desserts.length > 1 && recs.length < 4) recs.push(desserts[1]);
    return recs;
  }, [allMenuItems]);

  const dessertItems = useMemo(() => {
    if (!allMenuItems) return [];
    return allMenuItems.filter(i => 
      (i.category || '').toLowerCase().includes('dessert') || 
      (i.subcategory || '').toLowerCase().includes('dessert') || 
      /cake|baklava|knafeh|sweet|brownie|ice cream/i.test(i.name || '')
    ).slice(0, 3);
  }, [allMenuItems]);

  const hasDessertInCart = useMemo(() => {
    return cart.some(ci => 
      (ci.item.category || '').toLowerCase().includes('dessert') || 
      (ci.item.subcategory || '').toLowerCase().includes('dessert') || 
      /cake|baklava|knafeh|sweet|brownie|ice cream/i.test(ci.item.name || '')
    );
  }, [cart]);

  const handleCheckoutPress = () => {
    const itemWithMissing = cart.find(ci => getMissingRequiredModifierGroup(ci.item, ci.selectedModifiers));
    if (itemWithMissing) {
      onClose();
      if (onSelectItem) onSelectItem(itemWithMissing.item);
      return;
    }

    if (!hasDessertInCart && !hasDismissedDessert && dessertItems.length > 0) {
      setShowDessertModal(true);
      return;
    }

    onPlaceOrder(effectiveNotes);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, isMobile && { flexDirection: 'column', justifyContent: 'flex-end' }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={[
          styles.drawerContainer,
          { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
          isMobile ? {
            width: '100%',
            maxWidth: '100%',
            height: '85%',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderLeftWidth: 0,
            borderTopWidth: 2,
            paddingHorizontal: 16,
            paddingTop: 16,
          } : {
            width: 440,
            maxWidth: '88%',
            height: '100%',
            borderLeftWidth: 1,
            paddingHorizontal: 24,
            paddingTop: 20,
          }
        ]}>
          {/* Mobile Handle Indicator */}
          {isMobile && (
            <View style={styles.mobileSheetHandle} />
          )}

          {/* Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.headerTitleGroup}>
              <ShoppingBag size={isMobile ? 18 : 22} color={theme.primaryColor} />
              <View>
                <Text style={[styles.drawerTitle, { color: theme.textColor, fontSize: isMobile ? 16 : 18 }]}>
                  YOUR TABLE ORDER
                </Text>
                <Text style={[styles.drawerSubtitle, { color: theme.mutedTextColor, fontSize: isMobile ? 9 : 10 }]}>
                  TABLE {theme.tableNumber} • {theme.name || 'LOUNGE'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
            >
              <X size={18} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          {/* Active Order Live Tracking Banner */}
          {activeTrackingSession && onOpenTrackOrder && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                onOpenTrackOrder();
              }}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(229, 177, 58, 0.12)',
                borderColor: theme.secondaryColor,
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginTop: 10,
                marginBottom: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Clock size={16} color={theme.secondaryColor} />
                <View>
                  <Text style={{ color: theme.secondaryColor, fontSize: 12, fontWeight: '800' }}>
                    Active Order #{activeTrackingSession.orderId ? activeTrackingSession.orderId.replace(/^cav-/, '') : 'Active'}
                  </Text>
                  <Text style={{ color: theme.mutedTextColor, fontSize: 10, marginTop: 1 }}>
                    Status: {(activeTrackingSession.status || activeTrackingSession.order?.status || 'PREPARING').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={{ color: theme.secondaryColor, fontSize: 11, fontWeight: '800' }}>
                TRACK ➔
              </Text>
            </TouchableOpacity>
          )}

          {/* Cart Content */}
          {cart.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBg, { backgroundColor: 'rgba(255,90,31,0.08)' }]}>
                <ShoppingBag size={isMobile ? 36 : 48} color={theme.primaryColor} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textColor, fontSize: isMobile ? 18 : 20 }]}>Your Order is Empty</Text>
              <Text style={[styles.emptyText, { color: theme.mutedTextColor, fontSize: isMobile ? 12 : 14 }]}>
                Explore our menu or launch the Digital Host to curate your table experience.
              </Text>
              {onOpenTrackOrder && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onOpenTrackOrder();
                  }}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 16,
                    paddingHorizontal: 18,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: 'rgba(229, 177, 58, 0.15)',
                    borderColor: theme.secondaryColor,
                    borderWidth: 1,
                  }}
                >
                  <Clock size={16} color={theme.secondaryColor} />
                  <Text style={{ color: theme.secondaryColor, fontSize: 13, fontWeight: '800' }}>
                    {activeTrackingSession ? 'Track Active Order' : 'Track an Existing Order'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
              {/* Already submitted items from kitchen (Locked) */}
              {activeTrackingSession?.order?.items && activeTrackingSession.order.items.length > 0 && (
                <View style={{ marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13 }}>🔒</Text>
                      <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>
                        ALREADY SENT TO KITCHEN (LOCKED)
                      </Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>
                        {(activeTrackingSession.order.status || activeTrackingSession.status || 'PREPARING').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {activeTrackingSession.order.items.map((prevItem: any, idx: number) => (
                    <View key={idx} style={{ paddingVertical: 5, borderBottomWidth: idx < activeTrackingSession.order.items.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: '700' }}>
                          {prevItem.qty || prevItem.quantity || 1}x {prevItem.name}
                        </Text>
                        <Text style={{ color: '#64748B', fontSize: 12 }}>
                          ${((prevItem.price || 0) * (prevItem.qty || prevItem.quantity || 1)).toFixed(2)}
                        </Text>
                      </View>
                      {prevItem.notes ? (
                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 1 }}>• {prevItem.notes}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}

              {/* Section header for current order items */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Text style={{ color: '#E5B13A', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>
                  {activeTrackingSession?.order?.items?.length ? 'NEW ITEMS TO ADD TO TABLE' : 'YOUR ITEMS'}
                </Text>
              </View>

              {cart.map((cartItem) => {
                const imageSource = getItemImageSource(cartItem.item);

                return (
                  <View 
                    key={cartItem.cartItemId} 
                    style={[styles.cartItemRow, { borderColor: theme.borderColor }]}
                  >
                    {/* Item Image */}
                    {imageSource ? (
                      <Image source={imageSource} style={[styles.itemImage, isMobile && { width: 56, height: 56 }]} resizeMode="cover" />
                    ) : (
                      <View style={[styles.placeholderImage, { backgroundColor: 'rgba(255,255,255,0.05)' }, isMobile && { width: 56, height: 56 }]}>
                        <Text style={{ fontSize: 18 }}>🍽️</Text>
                      </View>
                    )}

                    {/* Item Details */}
                    <View style={styles.itemDetails}>
                      <View style={styles.itemTitleRow}>
                        <Text style={[styles.itemName, { color: theme.textColor, fontSize: isMobile ? 14 : 15 }]}>
                          {cartItem.item.name}
                        </Text>
                        <TouchableOpacity onPress={() => onRemoveItem(cartItem.cartItemId)}>
                          <Trash2 size={16} color={theme.mutedTextColor} />
                        </TouchableOpacity>
                      </View>

                      {/* Modifiers List */}
                      {cartItem.selectedModifiers.length > 0 && (
                        <View style={styles.modifiersContainer}>
                          {cartItem.selectedModifiers.map((m, idx) => (
                            <Text key={idx} style={[styles.modifierTag, { color: theme.mutedTextColor }]}>
                              • {m.optionName || m.name} {m.price > 0 ? `(+$${m.price.toFixed(2)})` : ''}
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {/* Item Notes */}
                      {cartItem.notes ? (
                        <Text style={[styles.modifierTag, { color: theme.mutedTextColor, fontStyle: 'italic', marginTop: 2 }]}>
                          • Note: {cartItem.notes}
                        </Text>
                      ) : null}

                      {/* Missing required choice alert */}
                      {(() => {
                        const missingGroup = getMissingRequiredModifierGroup(cartItem.item, cartItem.selectedModifiers);
                        if (!missingGroup) return null;
                        return (
                          <TouchableOpacity
                            onPress={() => {
                              onClose();
                              if (onSelectItem) onSelectItem(cartItem.item);
                            }}
                            activeOpacity={0.8}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              borderColor: '#EF4444',
                              borderWidth: 1,
                              borderRadius: 8,
                              paddingVertical: 5,
                              paddingHorizontal: 8,
                              marginTop: 6,
                              alignSelf: 'flex-start',
                            }}
                          >
                            <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '800' }}>
                              ⚠️ Sauce choice missing — Tap to select
                            </Text>
                          </TouchableOpacity>
                        );
                      })()}

                      {cartItem.specialInstructions ? (
                        <Text style={[styles.instructionText, { color: theme.textColor }]}>
                          📝 {cartItem.specialInstructions}
                        </Text>
                      ) : null}

                      {/* Quantity & Item Total */}
                      <View style={styles.itemBottomRow}>
                        <QuantitySelector
                          quantity={cartItem.quantity}
                          onIncrease={() => onUpdateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}
                          onDecrease={() => onUpdateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}
                        />
                        <Text style={[styles.itemPrice, { color: theme.secondaryColor, fontSize: isMobile ? 14 : 16 }]}>
                          ${cartItem.itemTotal.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Order-Level Note Field */}
              <View style={{ marginTop: 12, marginBottom: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: theme.borderColor }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Text style={{ fontSize: 12 }}>📝</Text>
                  <Text style={{ color: theme.textColor, fontSize: 12, fontWeight: '800' }}>
                    ORDER NOTES & SPECIAL REQUESTS
                  </Text>
                </View>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderColor: theme.borderColor,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 8,
                    color: theme.textColor,
                    fontSize: 16,
                    minHeight: 44,
                    textAlignVertical: 'top',
                    // @ts-ignore
                    outlineStyle: 'none' as any,
                  }}
                  placeholder="e.g. Extra napkins, glasses of water with ice, table allergy info..."
                  placeholderTextColor={theme.mutedTextColor}
                  value={effectiveNotes}
                  onChangeText={setEffectiveNotes}
                  multiline
                />
              </View>

              {/* Upsell Recommendations on Total Screen */}
              {recommendations.length > 0 && (
                <View style={{ marginTop: 4, marginBottom: 14 }}>
                  <Text style={{ color: '#E5B13A', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 }}>
                    RECOMMENDED TO PAIR WITH YOUR ORDER
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {recommendations.map((rec) => (
                      <View
                        key={rec.id}
                        style={{
                          width: 140,
                          padding: 8,
                          borderRadius: 10,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.1)',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{ color: theme.textColor, fontSize: 11, fontWeight: '800' }} numberOfLines={1}>
                          {rec.name}
                        </Text>
                        <Text style={{ color: theme.secondaryColor, fontSize: 11, fontWeight: '800', marginVertical: 4 }}>
                          ${rec.price.toFixed(2)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (onAddToCart) {
                              onAddToCart(rec, 1, []);
                            }
                          }}
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            borderColor: '#22C55E',
                            borderWidth: 1,
                            paddingVertical: 4,
                            borderRadius: 6,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '900' }}>+ ADD</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer Summary & Checkout */}
          {cart.length > 0 && (
            <View style={[styles.drawerFooter, { borderTopColor: theme.borderColor }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.mutedTextColor }]}>Subtotal</Text>
                <Text style={[styles.summaryVal, { color: theme.textColor }]}>${subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.mutedTextColor }]}>Sales Tax (8.25%)</Text>
                <Text style={[styles.summaryVal, { color: theme.textColor }]}>${tax.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.mutedTextColor }]}>Gratuity (18%)</Text>
                <Text style={[styles.summaryVal, { color: theme.textColor }]}>${(gratuity !== undefined ? gratuity : subtotal * 0.18).toFixed(2)}</Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: theme.textColor }]}>FINAL TOTAL</Text>
                <Text style={[styles.totalVal, { color: theme.secondaryColor, fontSize: isMobile ? 20 : 24 }]}>${total.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                onPress={handleCheckoutPress}
                activeOpacity={0.88}
                style={[styles.checkoutBtn, { backgroundColor: '#10B981', paddingVertical: isMobile ? 12 : 16 }]}
              >
                <Sparkles size={isMobile ? 16 : 20} color="#FFFFFF" />
                <Text style={[styles.checkoutBtnText, isMobile && { fontSize: 13 }]}>SEND ORDER TO KITCHEN</Text>
                <ArrowRight size={isMobile ? 16 : 20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dessert Upsell Modal Prompt */}
        {showDessertModal && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            zIndex: 999,
          }}>
            <View style={{
              backgroundColor: theme.cardColor,
              borderColor: '#E5B13A',
              borderWidth: 1.5,
              borderRadius: 20,
              padding: 18,
              maxWidth: 420,
              width: '100%',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 24 }}>🍰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textColor, fontSize: 16, fontWeight: '900' }}>
                    Complete with Dessert?
                  </Text>
                  <Text style={{ color: '#E5B13A', fontSize: 11, fontWeight: '700' }}>
                    SPECIAL RECOMMENDATION BEFORE CHECKOUT
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setHasDismissedDessert(true);
                    setShowDessertModal(false);
                    onPlaceOrder(effectiveNotes);
                  }}
                >
                  <X size={20} color={theme.mutedTextColor} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: theme.mutedTextColor, fontSize: 12, marginBottom: 12 }}>
                Would you like to add a signature dessert to your table before sending your order to the kitchen?
              </Text>

              <View style={{ gap: 8, marginBottom: 14 }}>
                {dessertItems.map((dessert) => (
                  <View
                    key={dessert.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: theme.textColor, fontSize: 13, fontWeight: '800' }}>
                        {dessert.name}
                      </Text>
                      <Text style={{ color: theme.secondaryColor, fontSize: 12, fontWeight: '800' }}>
                        ${dessert.price.toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        if (onAddToCart) onAddToCart(dessert, 1, []);
                        setHasDismissedDessert(true);
                        setShowDessertModal(false);
                      }}
                      style={{
                        backgroundColor: '#22C55E',
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>ADD</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => {
                  setHasDismissedDessert(true);
                  setShowDessertModal(false);
                  onPlaceOrder(effectiveNotes);
                }}
                style={{
                  paddingVertical: 11,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ color: theme.textColor, fontSize: 12, fontWeight: '800' }}>
                  No thanks, Send Order to Kitchen ➔
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    paddingBottom: 24,
  },
  mobileSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerTitle: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  drawerSubtitle: {
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  itemList: {
    flex: 1,
    marginVertical: 12,
  },
  cartItemRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  placeholderImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontWeight: '800',
    flex: 1,
  },
  modifiersContainer: {
    marginTop: 2,
  },
  modifierTag: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  instructionText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  itemPrice: {
    fontWeight: '900',
  },
  drawerFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalVal: {
    fontWeight: '900',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    marginTop: 8,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
