import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput,
  useWindowDimensions 
} from 'react-native';
import { Search, Plus, Minus, X, Check, ShoppingBag } from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BenzinHeader } from '../components/Navigation/BenzinHeader';
import { BottomNavigation } from '../components/Navigation/BottomNavigation';
import { MenuItem, SelectedModifier, CartItem } from '../types';
import { MENU_IMAGES, getItemImageSource } from '../data/menu_images';

interface MenuBrowsingProps {
  onBack: () => void;
  onSelectItem: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem, qty: number, modifiers: SelectedModifier[], notes?: string) => void;
  onOpenCart: () => void;
  onCallServer: () => void;
  onOpenHost?: () => void;
  onOpenMixLab?: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartItems?: CartItem[];
  onUpdateQuantity?: (cartItemId: string, newQty: number) => void;
  onRemoveItem?: (cartItemId: string) => void;
  allMenuItems: MenuItem[];
}

export const MenuBrowsing: React.FC<MenuBrowsingProps> = ({
  onBack,
  onSelectItem,
  onAddToCart,
  onOpenCart,
  onCallServer,
  onOpenHost,
  onOpenMixLab,
  cartCount,
  cartSubtotal,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  allMenuItems,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();

  // Dynamic layout metrics based on iPad / Phone & Orientation
  const cardWidth = layout.cardWidthPercent;
  const imageHeight = layout.isTablet ? 175 : 195;

  const [activeCategory, setActiveCategory] = useState<'hookah' | 'food' | 'drinks'>('food');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isGlobalSearch = searchQuery.trim().length > 0;

  // Extract subcategories for active main category (Drinks explicitly has 3 sections)
  const subcategories = useMemo(() => {
    const categoryItems = allMenuItems.filter(item => item.category === activeCategory);
    const subSet = new Set<string>();
    categoryItems.forEach(item => {
      if (item.subcategory) subSet.add(item.subcategory);
    });
    return ['ALL', ...Array.from(subSet)];
  }, [allMenuItems, activeCategory]);

  // Global search across ALL menu items regardless of active category or subcategory
  const filteredItems = useMemo(() => {
    if (isGlobalSearch) {
      const q = searchQuery.toLowerCase().trim();
      return allMenuItems.filter((item) => 
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q))
      );
    }

    return allMenuItems.filter((item) => {
      const matchesCategory = item.category === activeCategory;
      const matchesSubcategory = activeSubcategory === 'ALL' || item.subcategory === activeSubcategory;
      return matchesCategory && matchesSubcategory;
    });
  }, [allMenuItems, activeCategory, activeSubcategory, searchQuery, isGlobalSearch]);

  const hasHookahs = useMemo(() => (allMenuItems || []).some(item => item.category === 'hookah'), [allMenuItems]);
  const hasFood = useMemo(() => (allMenuItems || []).some(item => item.category === 'food'), [allMenuItems]);
  const hasDrinks = useMemo(() => (allMenuItems || []).some(item => item.category === 'drinks'), [allMenuItems]);

  const categories = useMemo(() => {
    const list: Array<{ key: 'food' | 'hookah' | 'drinks'; label: string }> = [];
    if (hasFood || (!hasHookahs && !hasDrinks)) {
      list.push({ key: 'food', label: 'FOOD & DINING' });
    }
    if (hasHookahs) {
      list.push({ key: 'hookah', label: 'HOOKAH' });
    }
    if (hasDrinks) {
      list.push({ key: 'drinks', label: 'BEVERAGES' });
    }
    return list;
  }, [hasHookahs, hasFood, hasDrinks]);

  // Keep active category aligned with available categories
  React.useEffect(() => {
    if (activeCategory === 'hookah' && !hasHookahs) {
      setActiveCategory('food');
    }
  }, [hasHookahs, activeCategory]);

  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const handleUpdateItemQty = (item: MenuItem, delta: number, e: any) => {
    e.stopPropagation();
    const currentQty = itemQuantities[item.id] || 0;
    const newQty = Math.max(0, currentQty + delta);

    setItemQuantities(prev => ({
      ...prev,
      [item.id]: newQty,
    }));

    if (delta > 0 && onAddToCart) {
      onAddToCart(item, 1, []);
      setToastMessage(` Added "${item.name}" to cart`);
      setTimeout(() => setToastMessage(null), 2200);
    } else if (delta < 0) {
      const existingCartItem = cartItems?.find(ci => ci.item.id === item.id);
      if (existingCartItem) {
        if (existingCartItem.quantity > 1 && onUpdateQuantity) {
          onUpdateQuantity(existingCartItem.cartItemId, existingCartItem.quantity - 1);
        } else if (onRemoveItem) {
          onRemoveItem(existingCartItem.cartItemId);
        }
      }
    }
  };

  const handleQuickAdd = (item: MenuItem, e: any) => {
    handleUpdateItemQty(item, 1, e);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Toast Notification Banner (Item Added Animation Feedback) */}
      {toastMessage && (
        <View style={[styles.floatingToast, { backgroundColor: theme.primaryColor }]}>
          <ShoppingBag size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
          <Check size={18} color="#FFFFFF" />
        </View>
      )}

      {/* Header */}
      <BenzinHeader
        showBackButton
        onBack={onBack}
        onOpenCart={onOpenCart}
        onOpenCallServer={onCallServer}
        onOpenHost={onOpenHost || onBack}
        cartCount={cartCount}
        title="RESTAURANT MENU"
        subtitle={`TABLE ${theme.tableNumber} • ${theme.name || 'LOUNGE'}`}
      />

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Category Navigation Tabs & Global Search */}
        <View style={styles.topControlRow}>
          {/* Category Tabs */}
          <View style={styles.tabsRow}>
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat.key && !isGlobalSearch;
              return (
                <TouchableOpacity
                  key={cat.key || `cat_${idx}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveCategory(cat.key as any);
                    setActiveSubcategory('ALL');
                  }}
                  style={[
                    styles.tabPill,
                    { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                    isActive && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor },
                  ]}
                >
                  <Text style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : theme.textColor }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
            <Search size={18} color={theme.mutedTextColor} />
            <TextInput
              style={[styles.searchInput, { color: theme.textColor }]}
              placeholder="Search entire menu (food, hookah, drinks)..."
              placeholderTextColor={theme.mutedTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isGlobalSearch && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={theme.mutedTextColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Global Search Indicator Banner */}
        {isGlobalSearch && (
          <View style={styles.globalSearchBanner}>
            <Text style={[styles.globalSearchText, { color: theme.secondaryColor }]}>
              � GLOBAL SEARCH RESULT: {filteredItems.length} ITEMS FOUND FOR "{searchQuery.toUpperCase()}" ACROSS ALL CATEGORIES
            </Text>
          </View>
        )}

        {/* Subcategories Filter Pills Bar */}
        {!isGlobalSearch && subcategories.length > 1 && (
          <View style={styles.subcatRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatScroll}>
              {subcategories.map((sub, idx) => {
                const isActive = activeSubcategory === sub;
                return (
                  <TouchableOpacity
                    key={sub || `sub_${idx}`}
                    activeOpacity={0.8}
                    onPress={() => setActiveSubcategory(sub)}
                    style={[
                      styles.subcatPill,
                      { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                      isActive && { backgroundColor: theme.secondaryColor, borderColor: theme.secondaryColor },
                    ]}
                  >
                    <Text style={[
                      styles.subcatText, 
                      { color: isActive ? '#000000' : theme.textColor }
                    ]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Mix Lab Launch Banner when Hookah Category is Selected */}
        {!isGlobalSearch && activeCategory === 'hookah' && onOpenMixLab && (
          <TouchableOpacity
            onPress={onOpenMixLab}
            activeOpacity={0.88}
            style={[styles.mixLabCtaBanner, { backgroundColor: theme.cardColor, borderColor: '#E5B13A', borderWidth: 2 }]}
          >
            <View style={styles.mixLabCtaLeft}>
              <Text style={{ fontSize: 32 }}>🧪</Text>
              <View>
                <View style={[styles.mixLabPill, { backgroundColor: 'rgba(229,177,58,0.12)' }]}>
                  <Text style={[styles.mixLabPillText, { color: '#E5B13A' }]}>FLAVOR LABORATORY</Text>
                </View>
                <Text style={[styles.mixLabCtaTitle, { color: theme.textColor }]}>
                  CREATE YOUR OWN HOOKAH MIX
                </Text>
              </View>
            </View>
            <View style={[styles.mixLabCtaBtn, { backgroundColor: '#E5B13A' }]}>
              <Text style={[styles.mixLabCtaBtnText, { color: '#000000' }]}>ENTER MIX LAB</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Menu Items Grid */}
        <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
          {filteredItems.map((item, idx) => {
            const imageSource = getItemImageSource(item);
            const isPortraitCategory = item.category === 'drinks' || item.category === 'hookah';

            return (
              <TouchableOpacity
                key={item.id || `item_${idx}`}
                activeOpacity={0.88}
                onPress={() => onSelectItem(item)}
                style={[
                  styles.itemCard,
                  { width: cardWidth, backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                  (itemQuantities[item.id] || 0) > 0 && { borderColor: '#10B981', borderWidth: 2.5 }
                ]}
              >
                {/* Image & Badge Header */}
                <View style={[
                  styles.cardImageWrapper, 
                  { height: imageHeight, backgroundColor: theme.cardColor }
                ]}>
                  {imageSource ? (
                    <Image 
                      source={imageSource} 
                      style={styles.cardImage} 
                      resizeMode={isPortraitCategory ? 'contain' : 'cover'} 
                    />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={{ fontSize: 44 }}>
                        {item.category === 'hookah' ? '💨' : item.category === 'drinks' ? '🍹' : '🍔'}
                      </Text>
                    </View>
                  )}

                  {item.badge && (
                    <View style={[styles.cardBadge, { backgroundColor: theme.primaryColor }]}>
                      <Text style={styles.cardBadgeText}>{item.badge}</Text>
                    </View>
                  )}

                  {(itemQuantities[item.id] || 0) > 0 && (
                    <View style={[styles.selectedCountBadge, { backgroundColor: '#10B981' }]}>
                      <Check size={12} color="#FFFFFF" />
                      <Text style={styles.selectedCountText}>{itemQuantities[item.id]} IN ORDER</Text>
                    </View>
                  )}
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.itemName, { color: theme.textColor }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: theme.secondaryColor }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={[styles.itemDesc, { color: theme.mutedTextColor }]} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* HIGH VISIBILITY ADD BUTTON BAR (+ ADD TO ORDER & STEPPER) */}
                  {(() => {
                    const qty = itemQuantities[item.id] || 0;
                    return (
                      <View style={styles.cardBtnRow}>
                        {qty === 0 ? (
                          <TouchableOpacity
                            onPress={(e) => handleQuickAdd(item, e)}
                            activeOpacity={0.8}
                            style={[styles.quickAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5 }]}
                          >
                            <Plus size={16} color="#22C55E" />
                            <Text style={[styles.quickAddText, { color: '#22C55E' }]}>+ ADD</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.browseStepperRow}>
                            <TouchableOpacity
                              onPress={(e) => handleUpdateItemQty(item, -1, e)}
                              activeOpacity={0.8}
                              style={[styles.browseStepBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                            >
                              <Minus size={14} color={theme.textColor} />
                            </TouchableOpacity>

                            <View style={[styles.browseCountBadge, { backgroundColor: '#2C2B2A' }]}>
                              <Text style={styles.browseCountText}>{qty}</Text>
                            </View>

                            <TouchableOpacity
                              onPress={(e) => handleUpdateItemQty(item, 1, e)}
                              activeOpacity={0.8}
                              style={[styles.browseStepBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                            >
                              <Plus size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        )}

                        {item.modifierGroups && item.modifierGroups.length > 0 && (
                          <TouchableOpacity
                            onPress={() => onSelectItem(item)}
                            activeOpacity={0.8}
                            style={[styles.customizeBtn, { borderColor: '#E5B13A', borderWidth: 1.5 }]}
                          >
                            <Text style={[styles.customizeBtnText, { color: '#E5B13A' }]}>OPTIONS</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })()}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom Bar */}
      <BottomNavigation
        onBack={onBack}
        backText="HOME"
        totalCartSubtotal={cartSubtotal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  floatingToast: {
    position: 'absolute',
    bottom: 95,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  tabIcon: {
    fontSize: 15,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    minWidth: 320,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  globalSearchBanner: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(229,177,58,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,177,58,0.3)',
  },
  globalSearchText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subcatRow: {
    marginBottom: 16,
  },
  subcatScroll: {
    gap: 8,
  },
  subcatPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  subcatText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    paddingBottom: 24,
  },
  itemCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardImageWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardBody: {
    padding: 18,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    lineHeight: 23,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 18,
    height: 36,
  },
  cardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  quickAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  customizeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  customizeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mixLabCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  mixLabCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mixLabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  mixLabPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  mixLabCtaTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mixLabCtaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  mixLabCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  browseStepperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  browseStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  browseCountBadge: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  selectedCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
