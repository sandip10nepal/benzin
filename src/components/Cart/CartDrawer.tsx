import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Image 
} from 'react-native';
import { X, Trash2, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { CartItem } from '../../types';
import { QuantitySelector } from '../ui/QuantitySelector';
import { MENU_IMAGES, getItemImageSource } from '../../data/menu_images';

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
  onPlaceOrder: () => void;
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
  onPlaceOrder,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const isMobile = layout.isMobilePhone;

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
            </View>
          ) : (
            <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
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

                      {cartItem.specialInstructions ? (
                        <Text style={[styles.instructionText, { color: theme.primaryColor }]}>
                          Note: {cartItem.specialInstructions}
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
                onPress={onPlaceOrder}
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
