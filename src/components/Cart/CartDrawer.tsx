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
import { CartItem } from '../../types';
import { QuantitySelector } from '../ui/QuantitySelector';
import { MENU_IMAGES, getItemImageSource } from '../../data/menu_images';

interface CartDrawerProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  tax: number;
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
  total,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
}) => {
  const { theme } = useRestaurantTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.drawerContainer, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
          {/* Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.headerTitleGroup}>
              <ShoppingBag size={22} color={theme.primaryColor} />
              <View>
                <Text style={[styles.drawerTitle, { color: theme.textColor }]}>
                  YOUR TABLE ORDER
                </Text>
                <Text style={[styles.drawerSubtitle, { color: theme.mutedTextColor }]}>
                  TABLE {theme.tableNumber} • {theme.name || 'LOUNGE'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
            >
              <X size={20} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          {/* Cart Content */}
          {cart.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBg, { backgroundColor: 'rgba(255,90,31,0.08)' }]}>
                <ShoppingBag size={48} color={theme.primaryColor} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textColor }]}>Your Order is Empty</Text>
              <Text style={[styles.emptyText, { color: theme.mutedTextColor }]}>
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
                      <Image source={imageSource} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.placeholderImage, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                        <Text style={{ fontSize: 20 }}>�</Text>
                      </View>
                    )}

                    {/* Item Details */}
                    <View style={styles.itemDetails}>
                      <View style={styles.itemTitleRow}>
                        <Text style={[styles.itemName, { color: theme.textColor }]}>
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
                              • {m.optionName} {m.price > 0 ? `(+$${m.price.toFixed(2)})` : ''}
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
                        <Text style={[styles.itemPrice, { color: theme.secondaryColor }]}>
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
                <Text style={[styles.summaryLabel, { color: theme.mutedTextColor }]}>Estimated Tax (8.25%)</Text>
                <Text style={[styles.summaryVal, { color: theme.textColor }]}>${tax.toFixed(2)}</Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: theme.textColor }]}>TOTAL</Text>
                <Text style={[styles.totalVal, { color: theme.secondaryColor }]}>${total.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                onPress={onPlaceOrder}
                activeOpacity={0.88}
                style={[styles.checkoutBtn, { backgroundColor: '#10B981' }]}
              >
                <Sparkles size={20} color="#FFFFFF" />
                <Text style={styles.checkoutBtnText}>SEND ORDER TO KITCHEN</Text>
                <ArrowRight size={20} color="#FFFFFF" />
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
    width: 440,
    maxWidth: '88%',
    height: '100%',
    borderLeftWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  drawerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemList: {
    flex: 1,
    marginVertical: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
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
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  modifiersContainer: {
    marginTop: 4,
  },
  modifierTag: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  instructionText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  drawerFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalVal: {
    fontSize: 24,
    fontWeight: '900',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 12,
    shadowColor: '#0099FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
